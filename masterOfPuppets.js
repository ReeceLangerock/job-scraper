require("dotenv").config();
const puppeteer = require("puppeteer");
const JobPost = require("./JobPost");
const mongoose = require("mongoose");
const EmailHandler = require("./emailHandler");

async function mongooseConnect() {
  const MONGO_URI = `mongodb://${process.env.MONGO_USER}:${
    process.env.MONGO_PASSWORD
  }@ds163940.mlab.com:63940/counselorjobs`;
  if (!MONGO_URI) {
    throw new Error("You must provide a MongoLab URI");
  }

  mongoose.Promise = global.Promise;
  mongoose.connect(MONGO_URI, { useNewUrlParser: true });
  mongoose.connection
    .once("open", () => console.log("Connected to MongoLab instance."))
    .on("error", error => console.log("Error connecting to MongoLab:", error));
  return "connected";
}

async function deployThePuppets() {
  await mongooseConnect();
  var newPostings = [];

  if (newPostings.length) {
    console.log("NEW LISTING");
  }

  newPostings = await masterOfPuppets("60532", newPostings);
  newPostings = await masterOfPuppets("60439", newPostings);
  if (newPostings.length) {
    console.log(`found ${newPostings.length} new postings, sending email...`);
    EmailHandler(newPostings);
  } else {
    console.log("no new posts found, shutting it down...");
  }
}

async function masterOfPuppets(zipCode, newPostings) {
  console.log(`\nrunning search for zip code ${zipCode}...\n`);
  // navigate puppeteer to the site
  console.log("loading the page..");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--single-process"]
  });
  const page = await browser.newPage();
  await page.goto("https://www.k12jobspot.com/Search/Opportunities");

  // The page displays a modal for unauthenticated users, so we shake the mouse to get it to appear and then close it
  console.log("shaking the mouse...");
  try {

    await page.mouse.move(100, 100);
    await page.waitFor(1 * 1000);
    await page.click(".close-container button");
    await page.waitFor(1 * 500);
  } catch(e){ console.log(e)}

  // select the input fields and add our search parameters
  console.log("adding search parameters...");
  await page.click("input[name=keyword-search]");
  await page.keyboard.type("Counselor");
  await page.click("input[name=location-search]");
  await page.keyboard.type(zipCode);

  // click the search button and wait for the results
  console.log("searching...");
  await page.click("button.btn-search");
  await page.waitFor(8 * 1000);

  // after results come back, grab the list and loop through each of them
  console.log("grabbing results...");
  const results = await page.$$(".list .list-item");

  for (const result of results) {
    // jobId only exists in the the title, so grab that and parse it for the ID
    const title = await page.evaluate(el => el.querySelector(".title").innerText, result);
    const jobID = title
      .split("JobID")[1]
      .split(":")[0]
      .trim();
    console.log(`checking job: ${jobID}`);
    // Check if this job post is in the database
    var POST;
    try {
      POST = await JobPost.findById({ _id: jobID });
      await result.click();
      await page.waitFor(250);
    } catch (e) {
      console.log("error finding post");
      console.log(e);
    }
    if (!POST) {
      try {
        // click on the post so we can get the details
        console.log("found a new post! clicking on it...");

        // grabbing post information
        const link = await page.$eval(".job-overview .job-overview-visit-page", el => el.href);
        const description = await page.$eval(".job-overview .job-details-header", el => el.innerHTML);
        const datePosted = await page.evaluate(
          el => el.querySelector(".flex.subtitle.subtitle-right.ellipsis").innerText,
          result
        );
        const posting = {
          _id: jobID,
          title,
          datePosted,
          link,
          description
        };

        // saving post to database and adding it to
        console.log("saving post to database...");
        await JobPost.create(posting);
        newPostings.push(posting);
      } catch (e) {
        console.log(e);
      }
    }
  }
  if (!newPostings.length) {
    console.log("no new posts found with these search parameters");
  }
  await browser.close();
  return newPostings;
}

deployThePuppets();
