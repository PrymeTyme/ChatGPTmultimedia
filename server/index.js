//  ""

require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

function jsonReader(filePath, cb) {
    fs.readFile(filePath, (err, fileData) => {
        if (err) {
            return cb && cb(err);
        }
        try {
            const object = JSON.parse(fileData);
            return cb && cb(null, object);
        } catch (err) {
            return cb && cb(err);
        }
    });
}



async function fetchMovies(movielist) { // enetertwo args 1st arg array, second category uand api url
    const finalMovieList = []
    for (let i = 0; i < movielist.length; i++) {
        let url = `https://omdbapi.com/?t=${movielist[i]}&apikey=${process.env.REACT_APP_MOVIE_API_KEY}`;
        console.log(url)
        let res = await fetch(`${url}`);
        let data = await res.json();
        finalMovieList.push(data)
        //console.log(finalMovieList)
    }
    //console.log(finalMovieList)
    return finalMovieList
}

async function fetchBooks(list) {
    const finalList = []
    for (let i = 0; i < list.length; i++) {
        let url = `https://openlibrary.org/search.json?q=${list[i]}`;
        console.log(url)
        let res = await fetch(`${url}`);
        let data = await res.json();
        finalList.push(data)
        //console.log(finalMovieList)
    }
    //console.log(finalMovieList)
    return finalList
}


const configuration = new Configuration({
    organization: "org-8ZdRpQoSSrm9KTz3nzW82Bqb",
    apiKey: process.env.REACT_APP_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express()

app.use(bodyParser.json())
app.use(cors())
const port = 5000

var listTest = []


app.post('/', async (req, res) => {

    const { prompt, category } = req.body
    console.log(req.body)
    console.log(prompt)
    console.log(category)
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `what other similar ${category} can you recommend if i like ${prompt} output should be bullet point list`,
        max_tokens: 100,
        temperature: 0.5,
    });
    //console.log(prompt)
    // console.log(response.data)
    let resultArr = response.data.choices[0].text.split("\n").filter(char => /[^a-zA-Z0-9]/.test(char)) //.replace(/[^a-zA-Z]/gm,"")
    resultArr = resultArr.map((e) => { return e.replace(/([^\d])[0-9]{4,6}([^\d])/, '') }) //replace(/[^a-zA-Z\s!?]/g, '') })
    resultArr = resultArr.map((e) => { return e.replace(/[^a-zA-Z0-9 ]/g, "") })
    if (category == 'Books') {
        resultArr = resultArr.map((e) => { return e.split(' by ') }) // hackyHorror
        resultArr = resultArr.map((e) => { return e.shift() })
        resultArr = resultArr.map((e) => { return e.replace(/ /g, "_") })
        let finalBookList = await fetchBooks(resultArr)
        listTest = finalBookList
        const jsonString = JSON.stringify(listTest,null,2)
        fs.writeFile('./books.json', jsonString, err => {
            if (err) {
                console.log('Error writing file', err)
            } else {
                console.log('Successfully wrote file')
            }
        })

    } else {
        resultArr = resultArr.map((e) => { return e.trim() })
        let finalMovieList = await fetchMovies(resultArr);
        listTest = finalMovieList
        const jsonString = JSON.stringify(listTest,null,2)
        fs.writeFile('./movies.json', jsonString, err => {
            if (err) {
                console.log('Error writing file', err)
            } else {
                console.log('Successfully wrote file')
            }
        })
    }
    // let finalMovieList = await fetchMovies(resultArr);
    //console.log(finalMovieList)
    console.log(resultArr)
    res.json({
        // data: response.data
        data: resultArr,//response.data.choices[0].text
        test: listTest

    })
    // listTest = finalMovieList


});

app.get('/', async (req, res) => {
    const { prompt, category } = req.body // change based on switch in category ?
    console.log('GET RESPONMSE')
    console.log(listTest)
    console.log('getCategorty'+category)
    if (category == 'Books'){
        jsonReader("./books.json", (err, books) => {
            if (err) {
              console.log(err);
              return;
            }
            res.json(books)
          })
    }else{
        jsonReader("./movies.json", (err, movies) => {
            if (err) {
              console.log(err);
              return;
            }
            res.json(movies)
          })
    }
    
})

app.listen(port, () => {
    console.log(`nAPP listening to http://localhost:${port}`)
})
