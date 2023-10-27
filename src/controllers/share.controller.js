const shareLink = async (req, res) => {


  const { title, description, imageUrl, city, date, url } = req.query

  console.log(`title :: ${title},  desc:${description} imageUrl:${imageUrl}, city:${city} `)

  if (!title || !description || !imageUrl || !city || !date) return res.status(400).send(Buffer.from(`<h2> title,description,imageUrl,city and date are required </h2`))

  res.set('Content-Type', 'text/html')
  res.set('Content-Security-Policy', "script-src 'self' 'unsafe-inline'");

  return res.status(200).send(Buffer.from(
    `<html>
    <title>  ${title}  </title>
    <head>
    <meta content="${imageUrl}" itemprop="image">
    <meta content="${imageUrl}" property="og:image"> 
    <meta property="og:url" content="https://thepinpointsocial.com" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Your Website Name" />
    <meta content="\n 
    ${city}
    ${date} \n \n 
    ${description} \n"
     name="Description">
    <meta property="og:description" content="\n 
    ${city} \n \n 
    ${date} \n \n 
    ${description} \n ">
    <meta content="initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" name="viewport"> 
    <meta content="chrome=1" http-equiv="X-UA-Compatible"> 
    <meta content="notranslate" name="google"> 
    <meta content="origin" name="referrer">
    <meta content="${title}" itemprop="name"> 
    <meta content="${title}" property="og:title">  
    <meta content="256" property="og:image:width"> <meta content="256" property="og:image:height"> 
    <meta content="\n
     ${city}, \n \n 
     ${date}, \n \n 
     ${description} \n" itemprop="description"> 
    <meta content="${title}" property="og:site_name">
    <meta content="summary" name="twitter:card"
    </head>
    <script>
    window.onload = function(event) {
      window.location.replace('${url}')
    }
           
    </script>
    </html>
  `
  ))
}

module.exports = {
  shareLink
}
