import fs, { access } from 'fs'
import Text2ImageAPI from './Text2ImageAPI.js'
import path from 'path'
import cors from 'cors'
import express from 'express';
import 'dotenv/config'
import dotenv from 'dotenv'

import http from 'http'
import https from 'https'

import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import { dirname } from 'path';
import stream from 'stream';
//import cookieSession from 'cookie-session';
import cookieParser from 'cookie-parser';
//import rethinkdb from 'rethinkdb' // need install first // npm install rethinkdb 



import validateForm from './utility/validateForm.js'
import registerUser from './utility/registerUser.js'
import loginUser from './utility/loginUser.js'
import saveUserData from './utility/saveUserData.js'
import getUser from './utility/getUser.js'
import getUserData from './utility/getUserData.js'
import JWTcreate from './utility/JWTcreate.js'
import JWTverify from './utility/JWTverify.js'
import createUniqueId from './utility/createUniqueId.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = 3001

const app = express();

app.use(express.json()) //Использовать json


// CORS WhiteList
const whitelist = ['http://localhost:3000', 'https://rustamproject.ru' ]
const corsOptions = {
    credentials: true,

    origin: function(origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) { // !origin если запрос с того же источника, на котором находится скрипт
            callback(null, true)
        } else {
            callback(new Error(`Not allowed by CORS`))
        }
    }
}
app.use(cors(corsOptions));

app.use(cookieParser())

dotenv.config();



async function generateImage(prompt = 'Sun in sky', style = 0, width = 1024, height = 1024, images = 1) {
    const api = new Text2ImageAPI('https://api-key.fusionbrain.ai/', process.env.API_KEY, process.env.SECRET_KEY)
    const modelId = await api.getModels();
    const uuid = await api.generate(prompt, modelId, images, width, height, style); //prompt, model, images = 1, width = 1024, height = 1024, style = 3
    const generatedImages = await api.checkGeneration(uuid)

    if (!generatedImages) {
        return false
    }
    // Начало создания файла
    const base64String = generatedImages[0]
    // Преобразование строки base64 в бинарные данные
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/,'')
    /*// Создание буфера из бинарных данных
    const buffer = Buffer.from(base64Data, 'base64')

    //Запись буфера в файл
    fs.writeFile('./image.jpg', buffer, 'base64', (err) => {
        if (err) throw err;
        console.log('Файл сохранен')
    })*/

    return base64Data
}

app.get('/', async (req, res) => {
    res.status(200)
    res.end('Welcome to API server')
})

app.post('/api/generator', async (req, res) => {
    if (!req.cookies.username || !req.body.prompt) {
        res.status(400)
        res.end()
        return
    }

    const imageBase64 = await generateImage(req.body.prompt, req.body.style, req.body.width, req.body.height)

    if (!imageBase64) {
        res.status(500)
        res.end('fusion ai error')
        return
    }
    const buffer = Buffer.from(imageBase64, 'base64')
    //res.end(buffer);
   
    const uniqueId = createUniqueId()
    const fileName = `${req.cookies.username}_${req.body.prompt}_${uniqueId}.jpg`
    
    //Запись буфера в файл
    fs.writeFile(`./data/generations/${fileName}`, buffer, 'base64', (err) => {
        if (err) {
            res.status(500)
            res.json({
                error: `Ошибка создания файла ${err}`
            })
        } else {
            console.log(`Файл ${fileName} сохранен`)
            res.status(200)
            res.json({ //отправить ссылку на файл в запросе
                image_link: `data/generations/${fileName}` //пихнуть в пользовательские данные в галерею ЕСЛИ ЗАЛОГИНЕН (НЕ GUEST)
            })
        }
    })
});

app.get('/data/generations/:file', (req, res) => {
    const dataPath = path.join(__dirname, `./data/generations/${req.params.file}`)
    //TODO проверки
    res.sendFile(dataPath);
});

app.post('/api/register', (req, res) => {
    const dataPath = path.join(__dirname, './data/users.json')
    const user = registerUser(req, res, dataPath)
    
    //Ответ на запрос
    if (user) {
        const token = JWTcreate(user)

        res.status(200)
    
        res.cookie('username', user.username, {
            maxAge: 1000 * 60 * 60 * 24, // 24 часа
            secure: true,
            sameSite: 'none'
        })
        res.cookie('access_token', token, {
            maxAge: 1000 * 60 * 60 * 24, // 24 часа
            //httpOnly: true,
            secure: true,
            sameSite: 'none'
        })
        
        res.json({
            data: {
                user: user
            },
        });
    }
});

app.post('/api/login', (req, res) => {
    const dataPath = path.join(__dirname, './data/users.json')
    const user = loginUser(req, res, dataPath)

    //Ответ на запрос
    if (user) {
        res.status(200)

        const token = JWTcreate(user)
        user.access_token = token

        res.cookie('username', user.username, {
            maxAge: 1000 * 60 * 60 * 24, // 24 часа
            secure: true,
            //httpOnly: true,
            sameSite: 'none'
        })
        
        res.cookie('access_token', token, {
            maxAge: 1000 * 60 * 60 * 24, // 24 часа
            secure: true,
            //httpOnly: true,
            sameSite: 'none'
        })
        
        res.json({
            data: {
                user: user
            },
        });
    }
});

app.post('/api/save/:data', (req, res) => {
    const dataPath = path.join(__dirname, './data/users_data.json')
    const username = req.cookies.username

    const user_data_saved = saveUserData(username, req.params.data, req.body, dataPath)

    
    if ( JWTverify(req) ) {
        res.status(200)
        res.json(user_data_saved);
    } else {
        res.status(401).send('bad JWT token')
    } 
});

app.get('/api/get/user/', (req, res) => {
    if ( JWTverify(req) ) {
        const dataPath = path.join(__dirname, './data/users.json')
        const user = getUser(req.cookies.username, dataPath)

        if (user) {
            res.status(200)
            res.json(user)
        } 

    }  else {
        res.status(400)
        res.end()
    }
})

app.get('/api/get/:data', (req, res) => {
    if (!req.cookies.access_token) {
        res.status(500)
        res.end('no access token')
    }
    if (!req.params.data) {
        res.status(500)
        res.end('no datatype param')
    }

    const dataPath = path.join(__dirname, './data/users_data.json')
    const user_data = getUserData(req.cookies.username, dataPath)

    res.json(user_data)
})

app.listen(port);