import fs from 'fs'

//module.exports = 
export default (username, pathReadFile) => {
    const data = fs.readFileSync(pathReadFile, {
        encoding: 'utf8'
    })

    let users_data = JSON.parse(data)

    const found_userdata = users_data[username]

    if (!found_userdata) {
        return false
    } else {
        return found_userdata
    }
}