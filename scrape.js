const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const csvWriter = require('csv-write-stream');
const fs = require('fs');
const chrome = require('chrome-aws-lambda');

puppeteer.use(StealthPlugin());


// Main handler function
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST instead.' });
    }

    const { keywords, page = 1, lci } = req.body;
    const allResults = [];
    const TIMEOUT = 30000;

    // Validate input
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({ error: 'Please provide a valid array of keywords.' });
    }

    if (!lci) {
        return res.status(400).json({ error: 'LCI value must be provided.' });
    }

    try {
        console.log('Starting the scraping process...');
        
        // Launch Puppeteer browser instance using chrome-aws-lambda for compatibility in serverless environments
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: await chrome.executablePath,  // Use the headless Chromium from chrome-aws-lambda
            args: chrome.args,
            defaultViewport: chrome.defaultViewport,
            ignoreHTTPSErrors: true, // Ignore SSL errors
        });

        // Scraping each keyword
        for (const keyword of keywords) {
            console.log(`Scraping results for keyword: ${keyword}`);
            const pageInstance = await browser.newPage();
            pageInstance.setDefaultNavigationTimeout(TIMEOUT);

            let pageNumber = page;
            let isLastPage = false;

            // Scraping each page for the keyword
            while (!isLastPage) {
                console.log(`Scraping page ${pageNumber} for keyword: ${keyword}`);
                const url = `https://www.google.com/localservices/prolist?hl=en-GB&gl=uk&ssta=1&q=${encodeURIComponent(
                    keyword
                )}&oq=${encodeURIComponent(keyword)}&src=2&page=${pageNumber}&lci=${lci}`;
                await pageInstance.goto(url, { waitUntil: 'networkidle2' });

                // Extracting the data from the page
                const keywordResults = await getPageData(pageInstance);
                allResults.push(...keywordResults);
                console.log(`Scraped ${keywordResults.length} results from page ${pageNumber}.`);

                // Check if there's a next page
                isLastPage = await pageInstance.evaluate(() => {
                    const nextButton = document.querySelector('button[jsname="LgbsSe"]');
                    return !nextButton;
                });

                // If there's a next page, increment the page number
                if (!isLastPage) {
                    pageNumber++;
                    await pageInstance.waitForTimeout(3000); // Wait for 3 seconds to prevent rate-limiting
                }
            }

            await pageInstance.close();
        }

        // Close the browser instance
        await browser.close();

        // Generate CSV file
        console.log('Scraping completed. Generating CSV file...');
        const filePath = './public/scraped_data.csv';
        const writer = csvWriter({
            headers: ['Name', 'Address', 'Phone', 'Website', 'Reviews', 'Rating', 'Email'],
        });
        writer.pipe(fs.createWriteStream(filePath));
        allResults.forEach((result) => writer.write(result));
        writer.end();

        console.log('CSV file generated successfully.');
        res.status(200).json({ success: true, data: allResults, file: filePath });

    } catch (error) {
        console.error('Error during scraping:', error);
        res.status(500).json({ error: 'An error occurred while scraping.' });
    }
}

// Helper function to scrape the data from the page
const getPageData = async (page) => {
    return await page.evaluate(async () => {
        const organicCards = Array.from(document.querySelectorAll('div[data-test-id="organic-list-card"]'));
        let cardData = [];

        // Loop through each card and scrape the details
        for (const card of organicCards) {
            try {
                // Click on the card to expand the details
                await card.querySelector('div[role="button"] > div:first-of-type').click();
                await new Promise(resolve => setTimeout(() => resolve(), 1000));  // Wait for the card to load

                // Extract the details from the expanded card
                const name = document.querySelector(".tZPcob") ? document.querySelector(".tZPcob").innerText : "NONE";
                const phoneNumber = document.querySelector('[data-phone-number][role="button"][class*=" "]')
                    ? document.querySelector('[data-phone-number][role="button"][class*=" "]').querySelector("div:last-of-type").innerHTML
                    : "NONE";
                const website = document.querySelector(".iPF7ob > div:last-of-type")
                    ? document.querySelector(".iPF7ob > div:last-of-type").innerHTML
                    : "NONE";
                const address = document.querySelector(".fccl3c")
                    ? document.querySelector(".fccl3c").innerText
                    : "NONE";

                const reviews = document.querySelector('.PN9vWe') ? document.querySelector('.PN9vWe').innerText : "NONE";
                const rating = document.querySelector('.ZjTWef') ? document.querySelector('.ZjTWef').innerText : "NONE";
                const email = document.querySelector('.email-class-selector') ? document.querySelector('.email-class-selector').innerText : "NONE";

                cardData.push({
                    name,
                    address,
                    phone: phoneNumber === "NONE" ? phoneNumber : phoneNumber,
                    website,
                    email,
                    reviews,
                    rating,
                });
            } catch (e) {
                console.log(`Error in processing card: ${e}`);
            }
        }

        return cardData;
    });
};
