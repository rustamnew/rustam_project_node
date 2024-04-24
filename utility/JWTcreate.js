import jwt from 'jsonwebtoken';
export default (user) => {

    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    let data = {
        time: Date(),
        userId: user.id,
    }
 
    const token = jwt.sign(data, jwtSecretKey);

    return token
}