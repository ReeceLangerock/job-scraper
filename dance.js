var express = require("express");
var router = express.Router();
const puppeteer = require("puppeteer");
router.get("/", async function(req, res, next) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://www.k12jobspot.com/Search/Opportunities");
  console.log("navigating...");

  await page.mouse.move(100, 100);
  await page.waitFor(1 * 1000);
  console.log("shaking mouse...");

  await page.click(".close-container button");
  console.log("closing modal...");

  await page.waitFor(1 * 500);

  await page.click("input[name=keyword-search]");
  console.log("selecing keyword input...");

  await page.keyboard.type("Counselor");
  console.log("typing keyword...");

  await page.click("input[name=location-search]");
  console.log("selecing zip input...");

  await page.keyboard.type("60532");
  //60439
  console.log("typing zip...");

  await page.click("button.btn-search");
  console.log("searching...");
  await page.waitFor(8 * 1000);

  console.log("grabbing results");

  const results = await page.$$(".list .list-item");
  const temp = {};

  for (const result of results) {
    // pass the single handle below
    const title = await page.evaluate(el => el.querySelector(".title").innerText, result);
    const jobID = title
      .split("JobID")[1]
      .split(":")[0]
      .trim();
    const datePosted = await page.evaluate(
      el => el.querySelector(".flex.subtitle.subtitle-right.ellipsis").innerText,
      result
    );

    //mongo check for posting
    console.log("clicking result");
    await result.click();
    await page.waitFor(250);

    if (true) {
      try {
        console.log("clicking on post details");

        //   const postingDetails = await page.$$(".job-overview");
        const link = await page.$eval(".job-overview .job-overview-visit-page", el => el.href);
        const desc = await page.$eval(".job-overview .job-details-header", el => el.innerHTML);
        temp[jobID] = {
          title,
          datePosted,
          link,
          desc
        };
        console.log(link);
        console.log(desc);
      } catch (e) {
        console.error("indiviual post click failed");
      }
    }

    // do whatever you want with the data
    console.log(title, datePosted);
  }

  await page.screenshot({ path: "example.png" });

  await browser.close();
  res.json({ results: temp });
});

module.exports = router;
