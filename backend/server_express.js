const express = require("express")
const {LoadAllArticles, FindLatestUploadedTitles, SaveArticle, DeleteArticle, UpdateArticle, addImage} = require("./db_accesser")
const multer = require("multer");
const bp = require("body-parser");
const path = require("path")

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, "uploads"); // here we specify the destination . in this case i specified the current directory
    },
    filename: function(req, file, cb) {
      console.log(file);
      cb(null, file.originalname);// here we specify the file saving name . in this case i specified the original file name
    }
  });



const upload = multer({storage:storage})

const server = express()
server.use(express.static("./public"))
server.use(bp.urlencoded({ extended: false }));
server.use(bp.json());

function parseIsUploaded(isUploaded)
{
    if (isUploaded === "False")
        {
            return false
        }
    if (isUploaded === "True")
    {
        return  true
    }
    return isUploaded
}

function getSuperFolderPath()
{
    const current_folder_string_length = path.basename(__dirname).length
    const current_dir_string_length = __dirname.length

    return __dirname.slice(0, current_dir_string_length - current_folder_string_length - 1)
}

server.listen(4321, ()=>
    {
        console.log("server is listening on port 4321")
    }
)
server.get("/", (req, res)=>
    {
        const index_absolute = path.resolve(getSuperFolderPath(), "index.html")
        res.sendFile(index_absolute)
        console.log(__dirname)
    }
)
server.get("/about", (req, res)=>
    {
        const about_absolute = path.resolve(getSuperFolderPath(), "aims_page.html")
        res.sendFile(about_absolute)
    }
)
server.get("/contact", (req, res)=>
    {
        const contact_absolute = path.resolve(getSuperFolderPath(), "participation_page.html")
        res.sendFile(contact_absolute)
    }
)
server.get("/api/lastArticles:id", (req, res)=>
    {
        const {id} = req.params
        console.log(id)
        FindLatestUploadedTitles(id)
        .then(value => {
            console.log(value)
            res.status(200).send(value)
        }
        )
        .catch(()=> res.status(404).send({success: false, message:"articles are not found"}))
    }
)
server.post("/api/articles", (req, res)=>
    {
        const article = req.body
        article.isUploaded = parseIsUploaded(article.isUploaded)
        SaveArticle(article).then(value => res.json({success:true, message:article.title, id: value}))
    }
)
//must be encrypted, I suppose(since we don't want to be able to get all articles in browser as a user, but we want to see them in the editor)
server.get("/api/articles", (req, res) =>
    {
        LoadAllArticles(false).then(value =>{
            res.send(value)
        }
    )
    })
server.delete("/api/articles:id", (req, res)=>
    {
        const {id} = req.params
        DeleteArticle(id)
        res.json({success: true, message: ""})
    }
)
server.put("/api/articles:id", (req, res) =>
    {
        const {id} = req.params
        const article = req.body
        article.isUploaded = parseIsUploaded(article.isUploaded)
        
        UpdateArticle(article, id)
        res.json({success: true, message: article.title})
    })
server.get("/api/allUploadedArticles", (req, res)=>
    {
        LoadAllArticles(true).then(value => res.send(value))
    })
server.post("/api/images:id", upload.single("article_image"), (req, res)=>
    {

        const {id} = req.params
        addImage(id, req.file.filename)
        
        res.status(200).send("file disk upload success");
    })
server.all("*", (req, res)=>
    {
        res.status(404).send({success: false, message: "resource is not found"})
    }
)