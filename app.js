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
import uniqueLogin from './utility/uniqueLogin.js'
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

//app.use(express.static('public'));

const whitelist = ['http://localhost:3000', 'http://rustamproject.ru' ]
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
/*
app.use(cors({
    credentials: true, 
    origin: 'http://localhost:3000'
}))
*/
app.use(cors(corsOptions));

app.use(cookieParser())

dotenv.config();

/*app.use(cookieSession({
    name: 'session',
    keys: ['secret123123'],
  
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))*/




// Create HTTPs server.
/*const options = {
    key: fs.readFileSync(__dirname + '/private.key', 'utf8'),
    cert: fs.readFileSync(__dirname + '/public.cert', 'utf8')
};
var server = https.createServer(options, app);*/




async function generateImage(prompt = 'Sun in sky', style = 0, width = 1024, height = 1024, images = 1) {
    const api = new Text2ImageAPI('https://api-key.fusionbrain.ai/', process.env.API_KEY, process.env.SECRET_KEY)
    const modelId = await api.getModels();
    const uuid = await api.generate(prompt, modelId, images, width, height, style); //prompt, model, images = 1, width = 1024, height = 1024, style = 3
    const generatedImages = await api.checkGeneration(uuid)

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
    const buffer = Buffer.from(imageBase64, 'base64')
    //res.end(buffer);
   
    const uniqueId = createUniqueId()
    const fileName = `${req.cookies.username}_${req.body.prompt}_${uniqueId}.jpg`
    
    //Запись буфера в файл
    fs.writeFile(`./data/generations/${fileName}`, buffer, 'base64', (err) => {
        if (err) {
            res.json({
                error: `Ошибка создания файла ${err}`
            })
        }
        console.log(`Файл ${fileName} сохранен`)

        res.json({ //отправить ссылку на файл в запросе
            image_link: `data/generations/${fileName}` //пихнуть в пользовательские данные в галерею ЕСЛИ ЗАЛОГИНЕН (НЕ GUEST)
        })
    })
});

app.get('/data/generations/:file', (req, res) => {
    const dataPath = path.join(__dirname, `./data/generations/${req.params.file}`)
    //TODO проверки
    res.sendFile(dataPath);
});

app.post('/api/register', (req, res) => {
    const dataPath = path.join(__dirname, './data/users.json')
    const validate = validateForm(req.body)
    const uniqueUser = uniqueLogin(req.body.username, dataPath)

    if (validate.vaild === true && uniqueUser) {
        const user = registerUser(req.body, dataPath)


        if (user) {
            res.status(200)

            const token = JWTcreate(user)

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
        } else {
            validate.errorMessages.push('Ошибка создания пользователя')
            res.status(500)
            res.json(validate);
        }

    } 
});

app.post('/api/login', (req, res) => {
    const dataPath = path.join(__dirname, './data/users.json')
    const validate = validateForm(req.body)
    
    if (validate.vaild === true) {
        const user = loginUser(req.body, dataPath)

        if (user) {
            res.status(200)

            const token = JWTcreate(user)
            user.access_token = token

            res.cookie('username', user.username, { //Избавиться ?
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
        } else {
            validate.errorMessages.push('Такой пользователь не существует')
            res.status(404)
            res.json(validate);
        }
    } else {
        res.json(validate);
    } 
});

app.post('/api/save/user/:data', (req, res) => {
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
    const dataPath = path.join(__dirname, './data/users.json')
    console.log(req.cookies)
    if ( JWTverify(req) ) {
        res.status(200)
        const user = getUser(req.cookies.username, dataPath)
        res.json(user)
    } else {
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
/*
app.get('/api/user/:login', (req, res) => {
    const dataPath = path.join(__dirname, './data/users.json')

    const user_data = getUserData(req.params.login, dataPath)

    if ( user_data ) {
        res.json({
            status: 'ok',
            body: user_data
        });
    } else {
        res.json({
            status: 'error',
            body: req.body
        });
    } 
});*/
 

/*
// Generating JWT
app.post("/user/generateToken", (req, res) => {
    // Validate User Here
    // Then generate JWT Token
 
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    let data = {
        time: Date(),
        userId: 12,
    }
 
    const token = jwt.sign(data, jwtSecretKey);
 
    res.send(token);
});
 
// Verification of JWT
app.get("/user/validateToken", (req, res) => {
    // Tokens are generally passed in header of request
    // Due to security reasons.
 
    let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
 
    try {
        const token = req.header(tokenHeaderKey);
 
        const verified = jwt.verify(token, jwtSecretKey);
        if (verified) {
            return res.send("Successfully Verified");
        } else {
            // Access Denied
            return res.status(401).send(error);
        }
    } catch (error) {
        // Access Denied
        return res.status(401).send(error);
    }
});
*/

app.listen(port);