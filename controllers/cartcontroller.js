import userModel from "../models/Usermodel.js";


//add to cart
const addtocart = async(req, res) => {
   try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    let userData = await userModel.findById(req.userId);
    if (!userData) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let cartData = userData.cartData || {};
    const itemId = req.body?.itemId;
    if (!itemId) {
      return res.status(400).json({ success: false, message: 'itemId is required' });
    }

    if(!cartData[itemId]){
        cartData[itemId] = 1
    }
    else{
        cartData[itemId] += 1;
    }
    await userModel.findByIdAndUpdate(req.userId,{cartData});
    res.json({
        success: true,
        message: "Added to cart",
        cartData
    })
   } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Error"
      })
   }
}

//remove from cart

const removeFromCart = async(req, res) => {
   try {
       if (!req.userId) {
         return res.status(401).json({ success: false, message: 'Not authenticated' });
       }

       let userData = await userModel.findById(req.userId)
       if (!userData) {
         return res.status(404).json({ success: false, message: 'User not found' });
       }

       let cartData = userData.cartData || {};
       const itemId = req.body?.itemId;
       if (!itemId) {
         return res.status(400).json({ success: false, message: 'itemId is required' });
       }

       if (cartData[itemId] > 0) {
        cartData[itemId] -= 1;
       }
       await userModel.findByIdAndUpdate(req.userId,{cartData});
       res.json({
        success: true,
        message: "Removed From Cart",
        cartData
       })
   } catch (error) {
    console.log(error);
    res.status(500).json({
        success: false,
        message: "Error"
    })
    
   }
}

//fetchuser cart data
const getCart = async(req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        let userData = await userModel.findById(req.userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        let cartData = userData.cartData || {};
        res.json({ success: true, cartData });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Error"
        });
    }
};

export {addtocart,removeFromCart,getCart}