import { ReplaySubject, Observable } from "rxjs";
import {
    ParsedFeedData,
    ParsedFeedEntry
} from "./FeedData";
import * as podcast from "podcast";

export class PodFeedGenerator {

    public podFilledFeed: ReplaySubject<string>;

    constructor(
        private _transpileFeed: Observable<ParsedFeedData>,
        private _hostName: string,
        private _feedName: string
    ) {
        this.podFilledFeed = new ReplaySubject(1);
        _transpileFeed.subscribe((df: ParsedFeedData) => {
                console.log("Generating an XML file...")
                this.podFilledFeed.next(this._generateXml(df));
            }
        );
    }

    private _generateXml(feed: ParsedFeedData): string {

        let podcastOptions: IFeedOptions = {
            title: feed.name,
            feed_url: this._feedName,
            site_url: this._hostName,
            author: "@Fan"

        } as IFeedOptions;
        console.log(JSON.stringify(podcastOptions));
        let pod = new podcast(podcastOptions);
        feed.data.forEach(element => {
            let opts: IItemOptions = {
                title: element.name,
                description: element.description,
                url: element.localPath,
                date: new Date(element.date),
                enclosure: {
                    url: element.image
                }
            } as IItemOptions;
            console.log(JSON.stringify(opts));
            pod.item(opts);
        });
        return pod.xml();
    }
}
