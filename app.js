import fs, { access } from 'fs'
import Text2ImageAPI from './Text2ImageAPI.js'
import path from 'path'
import cors from 'cors'
import express from 'express';
import 'dotenv/config'
import dotenv from 'dotenv'

import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import { dirname } from 'path';
import stream from 'stream';
import cookieSession from 'cookie-session';
import cookieParser from 'cookie-parser';
//import rethinkdb from 'rethinkdb' // need install first // npm install rethinkdb 


//import 'http'
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

app.use(cors({
    credentials: true, 
    origin: 'http://localhost:3000'
}))

app.use(cookieParser())

app.use(cookieSession({
    name: 'session',
    keys: ['secret123123'/* secret keys */],
  
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))




//INSERT INTO `users`(`login`, `password`, `data`, `test`) VALUES ('admin','admin','{}','1');


/*
rethinkdb.connect({ host: 'localhost', port: 28015 }, (err, connection) => {
    if(err) throw err;

    rethinkdb.db('test').tableCreate('tv_shows').run(connection, (err, res) => {
        if(err) throw err;
        console.log(res);

        rethinkdb.table('tv_shows').insert({ name: 'Star Trek TNG' }).run(connection, (err, res) => {
            if(err) throw err;
            console.log(res);
        });

        /*
        rethinkdb.table('authors').insert([
            { name: "William Adama", tv_show: "Battlestar Galactica",
              posts: [
                {title: "Decommissioning speech", content: "The Cylon War is long over..."},
                {title: "We are at war", content: "Moments ago, this ship received word..."},
                {title: "The new Earth", content: "The discoveries of the past few days..."}
              ]
            },
            { name: "Laura Roslin", tv_show: "Battlestar Galactica",
              posts: [
                {title: "The oath of office", content: "I, Laura Roslin, ..."},
                {title: "They look like us", content: "The Cylons have the ability..."}
              ]
            },
            { name: "Jean-Luc Picard", tv_show: "Star Trek TNG",
              posts: [
                {title: "Civil rights", content: "There are some words I've known since..."}
              ]
            }
        ]).run(connection, function(err, result) {
            if (err) throw err;
            console.log(JSON.stringify(result, null, 2));
        })
        *//*
    });
});
*/













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
        if (err) throw err;
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
                //secure: true,
            })
            res.cookie('access_token', token, {
                maxAge: 1000 * 60 * 60 * 24, // 24 часа
                //secure: true,
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
    
    if (validate.vaild === true ) {
        const user = loginUser(req.body, dataPath)

        if (user) {
            res.status(200)

            const token = JWTcreate(user)

            res.cookie('username', user.username, {
                maxAge: 1000 * 60 * 60 * 24, // 24 часа
                //secure: true,
            })
            res.cookie('access_token', token, {
                maxAge: 1000 * 60 * 60 * 24, // 24 часа
                //secure: true,
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

app.get('/api/get/user/:data', (req, res) => {
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




 
// Set up Global configuration access
dotenv.config();
 
// Main Code Here  //
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












app.listen(port);