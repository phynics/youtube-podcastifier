import { Config, Podcast } from "./Models";
import { FeedScrapper } from "./FeedScrapper";
import { FeedTranspiler } from "./FeedTranspiler";
import { FeedGenerator } from "./FeedGenerator";
import * as express from "express";
import * as fs from "fs";

export class Podcastifier {
    private _expressServer: express.Express;
    private _feedScrapper: FeedScrapper[];
    private _feedTranspiler: FeedTranspiler[];
    private _feedGenerator: FeedGenerator[];

    constructor(
        private _configuration: Config,
        private _podcasts: Podcast[]
    ) {
        this._setupExpress();
        if (this._expressServer != null) {
            this._expressServer.listen(this._configuration.serverPort,
                () => console.log("Started express server at port " + this._configuration.serverPort + "."));
        }
        this._feedGenerator = new Array<FeedGenerator>();
        this._feedScrapper = new Array<FeedScrapper>();
        this._feedTranspiler = new Array<FeedTranspiler>();
        _podcasts.forEach((podcast, index) => {
            let feedS = new FeedScrapper(podcast);
            this._feedScrapper.push(feedS);
            let feedT = new FeedTranspiler(feedS.feedSubject);
            this._feedTranspiler.push(feedT);
            let feedG = new FeedGenerator(feedT.downloadFeed,
                this._configuration.serverURL + ":" + this._configuration.serverPort);
            feedG.xmlPodcastFeed.subscribe((xml) => this._saveXml(xml, podcast));
        });
    }

    private _setupExpress() {
        this._expressServer = express();
        let exp = this._expressServer;

        exp.get("/", (req, res) => {
            res.send("Podcastifier is serving the following feeds: <hr> <br>"
                + this._podcasts.map((value) => value.title).join("<br>"));
        });
        exp.get("/feeds/:podcastid/podcast.xml", (req, res) => {
            var podcastId: string = req.params["podcastid"];
            if (fs.existsSync(__dirname + "/" + this._configuration.feedPath + podcastId + ".xml")) {
                res.sendFile(__dirname + "/" + this._configuration.feedPath + podcastId + ".xml");
            }
        });
        exp.get("/:fileid", (req, res) => {
            var fileId: string = req.params["fileid"];
            if (fs.existsSync(__dirname + "/" + this._configuration.filePath + fileId + ".mp3")) {
                res.sendFile(__dirname + "/" + this._configuration.filePath + fileId + ".mp3");
            }
        });
    }

    private _saveXml(xml: string, podcast: Podcast) {
        fs.writeFile(__dirname + "/" + this._configuration.feedPath + podcast.id + ".xml", xml, () => { });
    }
}
