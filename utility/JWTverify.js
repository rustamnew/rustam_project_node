import jwt from 'jsonwebtoken';
export default (req/*, res*/) => {
    // Tokens are generally passed in header of request
    // Due to security reasons.
 
    let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
 
    try {
        const token = req.header(tokenHeaderKey);
        const verified = jwt.verify(token, jwtSecretKey);

        if (verified) {
            return verified.user
        } else {
            // Access Denied
            return false
            //return res.status(401).send(error);
        }
    } catch (error) {
        // Access Denied
        return false
        //return res.status(401).send(error);
    }
}