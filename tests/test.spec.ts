import * as winston from "winston";
import * as Instamancer from "..";
import {Hashtag, IOptions, Location, User} from "../src/api";

jest.setTimeout(120 * 60 * 1000);
/* tslint:disable:no-console */

const hashtags = ["beach", "gym", "puppies", "party", "throwback"];
const locations = ["1110037669039751", "212988663", "933522", "213385402", "228001889"];
const users = ["snoopdogg", "arianagrande", "bbc", "whitehouse", "australia"];
const posts = ["BsOGulcndj-", "Be3rTNplCHf", "BlBvw2_jBKp", "Bi-hISIghYe", "BfzEfy-lK1N", "Bneu_dCHVdn", "Brx-adXA9C1",
    "BlTYHvXFrvm", "BmRZH7NFwi6", "BpiIJCUnYwy"];

let smallSize = 30;
let mediumSize = 300;
let largeSize = 3000;

// Run faster unless executing in CI
if (!process.env.TRAVIS) {
    smallSize /= 10;
    mediumSize /= 10;
    largeSize /= 10;
}

const libraryTestOptions: IOptions = {
    logger: winston.createLogger({
        format: winston.format.json(),
        level: "error",
        silent: true,
        transports: [],
    }),
    silent: true,
    total: 10,
};

test("Library Classes", async () => {
    const total = 10;
    const objects = [
        new Instamancer.Hashtag(hashtags[0], libraryTestOptions),
        new Instamancer.User(users[0], libraryTestOptions),
        new Instamancer.Location(locations[0], libraryTestOptions),
        new Instamancer.Post(posts, libraryTestOptions),
    ];

    for (const object of objects) {
        const scraped = [];
        for await (const post of object.generator()) {
            expect(post).toBeDefined();
            scraped.push(post);
        }
        expect(scraped.length).toBe(total);
    }
});

test("Library Functions", async () => {
    const total = 10;
    const generators = [
        Instamancer.hashtag(hashtags[0], libraryTestOptions),
        Instamancer.user(users[0], libraryTestOptions),
        Instamancer.location(locations[0], libraryTestOptions),
        Instamancer.post(posts, libraryTestOptions),
    ];

    for (const generator of generators) {
        const scraped = [];
        for await (const post of generator) {
            expect(post).toBeDefined();
            scraped.push(post);
        }
        expect(scraped.length).toBe(total);
    }
});

class ApiTestConditions {
    public api: typeof InstagramEndpoint;
    public ids: string[];
    public sizes: number[];

    constructor(api: typeof InstagramEndpoint, ids: string[], sizes: number[]) {
        this.api = api;
        this.ids = ids;
        this.sizes = sizes;
    }
}

class InstagramEndpoint {
    constructor(id: string, options: object = {}) {
        id = null;
        options = null;
    }

    public async* generator() {
        // pass
    }
}

const endpoints: ApiTestConditions[] = [
    new ApiTestConditions(Hashtag, hashtags, [smallSize, mediumSize, largeSize]),
    new ApiTestConditions(Location, locations, [smallSize, mediumSize, largeSize]),
    new ApiTestConditions(User, users, [smallSize, mediumSize]),
];

test("Instagram API limits", async () => {
    for (const endpoint of endpoints) {
        // Get params
        const API = endpoint.api;
        const ids = endpoint.ids;
        const sizes = endpoint.sizes;

        for (const size of sizes) {
            // Decide how many ids to test based on size
            let sizeIds;
            let splitLen = 5;
            if (size === mediumSize) {
                splitLen = 3;
            } else if (size === largeSize) {
                splitLen = 1;
            }
            sizeIds = ids.slice(0, splitLen);

            for (const id of sizeIds) {
                console.log(`Testing ${id} ${size}`);
                // Specify API options
                const options: IOptions = {
                    enableGrafting: true,
                    fullAPI: false,
                    headless: true,
                    logger: winston.createLogger({
                        format: winston.format.json(),
                        level: "error",
                        silent: true,
                        transports: [],
                    }),
                    silent: false,
                    sleepTime: 2,
                    total: size,
                };

                // Create API
                const api = new API(id, options);

                // Get posts
                const scraped = [];
                const postIds = new Set();
                for await (const post of api.generator()) {
                    postIds.add(post.node.id);
                    scraped.push(post);
                }

                // Assert sizes
                expect(scraped.length).toBe(size);

                // Check duplicates
                expect(scraped.length).toBe(postIds.size);
            }
        }
    }
});

const apiOptions: IOptions[] = [
    {silent: true},
    {sleepTime: 5},
    {headless: false},
    {enableGrafting: false},
    {fullAPI: true},
];

test("API options", async () => {
    const hashtagId = "vetinari";
    const total = 50;
    let options: IOptions[] = [];

    // No options default
    options.push({});

    // Add options list
    options = options.concat(apiOptions.map((option) => {
        option.total = total;
        return option;
    }));

    let first = true;
    for (const option of options) {
        const tag = new Hashtag(hashtagId, option);
        const scraped = [];

        for await (const post of tag.generator()) {
            expect(post).toBeDefined();
            scraped.push(post);
        }

        if (first) {
            first = false;
            expect(scraped.length).toBeGreaterThan(total);
        } else {
            expect(scraped.length).toBe(total);
        }
    }
});

test("Pausing", async () => {
    const api = new Instamancer.Hashtag(hashtags[0], libraryTestOptions);
    const iterator = api.generator();

    await iterator.next();
    api.pause();

    await new Promise((resolve) => {
        setTimeout(resolve, 2000);
    });

    api.pause();

    for await (const post of iterator) {
        expect(post).toBeDefined();
    }
});

test("Hibernation", async () => {
    const options: IOptions = {
        hibernationTime: 10,
        total: smallSize,
    };

    const api = new Instamancer.Hashtag(hashtags[0], options);
    const iterator = api.generator();

    await iterator.next();
    api.toggleHibernation();

    for await (const post of iterator) {
        expect(post).toBeDefined();
    }
});

test("Sandbox", async () => {
    process.env["NO_SANDBOX"] = "true";
    for await (const post of Instamancer.hashtag(hashtags[0], libraryTestOptions)) {
        expect(post).toBeDefined();
    }
    process.env["NO_SANDBOX"] = "";
});

test("Failed Page visit", async () => {
    const options: IOptions = {
        proxyURL: "127.0.0.1:9999",
    };
    const api = new Instamancer.Hashtag(hashtags[0], options);
    const scraped = [];

    try {
        for await (const post of api.generator()) {
            scraped.push(post);
        }
    } catch (e) {
        expect(e).toBeDefined();
        await api.forceStop();
    }

    expect(scraped.length).toBe(0);
});