import jwt from 'jsonwebtoken';
export default (user) => {

    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    let user_JWT_data = {
        time: Date(),
        user,
    }
 
    const token = jwt.sign(user_JWT_data, jwtSecretKey);

    return token
}