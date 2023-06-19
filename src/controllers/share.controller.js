const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { followService } = require("@services");

const shareLink = catchAsync(async (req, res) => {
    res.set('Content-Type', 'text/html')

    const { title, description, imageUrl, city , date } = req.query

    console.log(`title :: ${title},  desc:${description} imageUrl:${imageUrl}, city:${city}, date:${date} `)

    if (!title || !description || !imageUrl || !city || !date) return res.status(400).send(Buffer.from(`<h2> title , description , imageUrl, city and date are required </h2`))

    // let imagePath = `https://firebasestorage.googleapis.com/v0/b/my-first-project-ce24e.appspot.com/o/pinpoint%2Fimage%2Fimage_${imageId}?alt=media&token=${imageToken}`


    return res.status(200).send(Buffer.from(
        `
    <title>  ${title}  </title>
    <meta content="${description}" name="Description">
    <meta property="og:description" content="${description}">

    <meta content="initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" name="viewport"> 
    <meta content="chrome=1" http-equiv="X-UA-Compatible"> 
    <meta content="notranslate" name="google"> 
    <meta content="origin" name="referrer">
    <meta content="${title}" itemprop="name"> 
    <meta content="${title}" property="og:title">  
    <meta content="${imageUrl}" itemprop="image">
    <meta content="${imageUrl}" property="og:image"> 
    <meta content="256" property="og:image:width"> <meta content="256" property="og:image:height"> 
    <meta content="${city} \n ${date} \n ${description}" itemprop="description"> 
    <meta content="${title}" property="og:site_name">
    <meta content="summary" name="twitter:card"
  `
    ))
})

module.exports = {
    shareLink
}
