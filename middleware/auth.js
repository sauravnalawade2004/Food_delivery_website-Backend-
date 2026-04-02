import jwt from "jsonwebtoken";

const authMiddleware = async(req, res, next) => {
   // Accept token from custom header `token` or standard `Authorization: Bearer <token>`
   const headerToken = req.headers.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
   console.log('Received Token:', headerToken); // Log the received token

   if (!headerToken) {
    return res.status(401).json({
        success: false,
        message: "Authentication required"
    })
   }

   try {
       const token_decode = jwt.verify(headerToken, process.env.JWT_SECRET)
       console.log('Decoded Token:', token_decode); // Log the decoded token
       req.userId = token_decode.id;
       req.user = token_decode; // attach full decoded payload for convenience
       next();

   } catch (error) {
        console.log('Token Error:', error); // Log the error details
        // Return specific error message for invalid token
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token. Please login again."
            })
        }
        res.status(401).json({
            success: false,
            message: "Authentication error"
        })
   }
}

export default authMiddleware;