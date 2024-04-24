import fs from 'fs'
import createUser from './createUser.js'

export default (reqBody, pathReadFile) => {
    const data = fs.readFileSync(pathReadFile, {
        encoding: 'utf8'
    })
    let users = JSON.parse(data)

    const user = createUser(reqBody, users)
    users.push(user)
    users = JSON.stringify(users, null, 4)


    fs.writeFileSync(pathReadFile, users, {
        encoding: 'utf8',
        flag: 'w',
    })


    if (user) {
        return user
    } else {
        return false
    }
    
}