import jwt from "jsonwebtoken";

const authMiddleware = async(req, res, next) => {
   const {token} = req.headers;
   if (!token) {
    return res.json({
        success: false,
        message: "login again"
    })
   }
   try {
       const token_decode = jwt.verify(token, process.env.JWT_SECRET)
       req.userId = token_decode.id;
       next();

   } catch (error) {
        console.log(error);
        // Return specific error message for invalid token
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.json({
                success: false,
                message: "Invalid or expired token. Please login again."
            })
        }
        res.json({
            success: false,
            message: "Authentication error"
        })
   }
}

export default authMiddleware;