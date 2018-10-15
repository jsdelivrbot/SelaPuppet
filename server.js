const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const cron = require("node-cron");

const express = require('express');
const dirPublic = path.join(__dirname, '/public');

let currentLessons = new Object();

app = express();
app.use(express.static(dirPublic))
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', {lessons: currentLessons});
})

app.get('/all', (req, res) => {
  res.sendFile(dirPublic+'/lessons.json');
})

var port = process.env.PORT || 3000;
app.listen(3000, () => {
  UpdateLessons();
  console.log('Starting on port 3000.')
})

cron.schedule("59 23 * * *", function() {
  UpdateLessons();
});


async function UpdateLessons() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const url = 'http://legacy17.sela.co.il/StudentsInfo/StudentLessons.aspx';
    await page.goto(url);
    
    await page.evaluate(()=> {
      
      let TbEmail = document.querySelector('#logStudent_UserName');
      TbEmail.value = "hamudlk1@gmail.com";
  
      let TbPassword = document.querySelector('#logStudent_Password');
      TbPassword.value = "1996dan";
  
      let BtnLogin = document.querySelector('#logStudent_LoginButton');
      BtnLogin.click();
    });
  
    //await setTimeout(() => console.log('waiting one second'), 1000);
    //await page.goBack();
    //await setTimeout(() => console.log('waiting one second'), 1000);
    //await page.reload();
    await page.screenshot({path: 'lastLogin.png'});
    await page.goto(url)
    await page.screenshot({path: 'LessonList.png'});
  
    let lessons = await page.evaluate(() => {
  
      let Rows = document.querySelector('#dgvLessons_ctl00').querySelectorAll('tr')
      
      let lessons = new Object();

      lessons = Array.from(Rows).map( row => {
        let lesson = new Object();

        let cells = Array.from(row.querySelectorAll('td'));
  
        lesson.extra = cells[0].innerText.trim();
        lesson.name = cells[1].innerText.trim();
        lesson.till = cells[2].innerText.trim();
        lesson.from = cells[3].innerText.trim();
        lesson.day = cells[4].innerText.trim();
        lesson.date = cells[5].innerText.trim();

        return lesson;
      })
  
      return lessons;
    })
  
    //fs.writeFile(dirPublic+'/lessons.json', JSON.stringify(lessons), err=> console.log(err));
    
    currentLessons = lessons;

    await browser.close();
}