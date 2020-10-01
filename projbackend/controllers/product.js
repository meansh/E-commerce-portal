const Product = require("../models/product");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

exports.getProductById = (req, res, next, id) => {
  Product.findById(id)
    .populate("category")
    .exec((err, product) => {
      if (err) {
        return res.status(400).json({
          error: "Product not found"
        });
      }
      req.product = product;
      next();
    });
};

exports.createProduct = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "problem with image"
      });
    }
    //destructure the fields
    const { name, description, price, category, stock } = fields;

    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({
        error: "Please include all fields"
      });
    }

    let product = new Product(fields);

    //handle file here
    if (file.photo) {
      if (file.photo.size > 3000000) {
        return res.status(400).json({
          error: "File size too big!"
        });
      }
      product.photo.data = fs.readFileSync(file.photo.path);
      product.photo.contentType = file.photo.type;
    }
    // console.log(product);

    //save to the DB
    product.save((err, product) => {
      if (err) {
        res.status(400).json({
          error: "Saving tshirt in DB failed"
        });
      }
      res.json(product);
    });
  });
};



// delete controllers
exports.deleteProduct = (req, res) => {
  let product = req.product;
  product.remove((err, deletedProduct) => {
    if (err) {
      return res.status(400).json({
        error: "Failed to delete the product"
      });
    }
    res.json({
      message: "Deletion was a success",
      deletedProduct
    });
  });
};

// delete controllers
exports.updateProduct = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "problem with image"
      });
    }

    //updation code
    let product = req.product;
    product = _.extend(product, fields);

    //handle file here
    if (file.photo) {
      if (file.photo.size > 10000000) { // 1024 * 1024 * 5Mb ~ 5000000 Kb = 5 Mb
        return res.status(400).json({
          error: "File size too big!"
        });
      }
      product.photo.data = fs.readFileSync(file.photo.path);
      product.photo.contentType = file.photo.type;
    }
    

    //save to the DB
    product.save((err, product) => {
      if (err) {
        res.status(400).json({
          error: "Updation of product failed"
        });
      }
      res.json(product);
    });
  });
};

exports.getAllProducts = (req, res) => {
    Product.find()
    .limit(8)   //limiting to 8 products
    .populate("category")
    .exec((err, products) => {
        if(err) {
            return res.status(400).json({
                error: "No product found"
            })
        }
        res.json(products)
    })
}


exports.updateStock = (req, res, next) => {
    let op = req.body.order.products.map(prod => {
        return {
            updateone: {
                filter: {_id: prod._id}, //Increase the count of sold and decrease stock.
                update: {$inc: {stock: -prod.count, sold: +prod.count}}

            }
        }
    })

    Product.bulkWrite(op, {}, (err, products) => {
        if(err){
            return res.status(400).json({
                error: "Bulk operation failed"
            })
        }
        next();
    })
}


exports.getAllUniqueCategories = (req, res) => {
    Product.distinct("category", {}, (err, category) => {
       if(err){
           return res.status(400).json({
               error: "No category found"
           });
       } 
       res.json(category)
    })
}














// exports.getProduct = (req, res) => {
//   req.product.photo = undefined;
//   return res.json(req.product);
// };

// //middleware
// exports.photo = (req, res, next) => {
//   if (req.product.photo.data) {
//     res.set("Content-Type", req.product.photo.contentType);
//     return res.send(req.product.photo.data);
//   }
//   next();
// };