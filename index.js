import express from "express"
import cors from "cors"
import multer from "multer"
import {v4 as uuidv4} from "uuid"
import path from "path"
import fs from "fs"
import {exec} from "child_process"
import { stderr, stdout } from "process"

const app=express();
app.use(cors({
    origin:[],
    credentials:true
}))

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"./uploads")
    },
    filename:function(req,file,cb){
        cb(null,file.fieldname+"-"+ uuidv4()+ path.extname(file.originalname))
    }
})

const upload=multer({storage:storage});

app.use((req,res,next)=>{
    res.header("Access-Control-Allow-Origin","*")
    next();
})

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use('/uploads',express.static("uploads"))


app.get('/', function(req,res){
    res.json({
        message:"hello world"
    })
})

app.post('/upload',upload.single('file'),function(req,res){
    const lessonId=uuidv4();
    const videoPath=req.file.path;
    const outputPath=`./uploads/courses/${lessonId}`;
    const hlsPath=`./${outputPath}/index.m3u8`;
    console.log("hlsPath",hlsPath);
    console.log(`outputpath ${outputPath}`)

    if(!fs.existsSync(outputPath)){
        fs.mkdirSync(outputPath,{recursive:true})
    }

    const ffmpegCmd=`ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 "${hlsPath}"`;

    exec(ffmpegCmd,(error,stdout,stderr)=>{
        if(error){
            console.log(`exec error is ${error}`)
        }
        console.log(`stdout ${stdout}`)
        console.log(`stderr ${stderr}`)
        const videoUrl=`http://localhost:8000/uploads/courses/${lessonId}/index.m3u8`;

        res.json({
            message:"video converted to hls format",
            lessonId:lessonId,
            videoUrl:videoUrl
        })
    })

})

app.listen(8000,function(){
    console.log("app is listening on port 8000");
});