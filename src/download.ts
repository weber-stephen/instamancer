import * as fs from "fs";
import * as json2csv from "json2csv";
import * as mkdirp from "mkdirp";
import * as request from "request";

/**
 * Download file
 * @param url The URL of the file
 * @param name The name used to identify the file
 * @param directory The directory to save the file
 */
export function download(url, name, directory) {
    mkdirp.sync(directory);
    request.get(url)
        .pipe(fs.createWriteStream(directory + "/" + name));
}

const fields = ["node.comments_disabled", "node.__typename", "node.id", "node.edge_media_to_caption.edges.0.node.text",
    "node.shortcode", "node.edge_media_to_comment.count", "node.taken_at_timestamp", "node.dimensions.height",
    "node.dimensions.width", "node.display_url", "node.edge_liked_by.count", "node.edge_media_preview_like.count",
    "node.owner.id", "node.thumbnail_src", "node.thumbnail_resources.0.src", "node.thumbnail_resources.0.config_width",
    "node.thumbnail_resources.0.config_height", "node.thumbnail_resources.1.src",
    "node.thumbnail_resources.1.config_width", "node.thumbnail_resources.1.config_height",
    "node.thumbnail_resources.2.src", "node.thumbnail_resources.2.config_width",
    "node.thumbnail_resources.2.config_height", "node.thumbnail_resources.3.src",
    "node.thumbnail_resources.3.config_width", "node.thumbnail_resources.3.config_height",
    "node.thumbnail_resources.4.src", "node.thumbnail_resources.4.config_width",
    "node.thumbnail_resources.4.config_height", "node.is_video", "node.video_view_count", "node.accessibility_caption"];

/**
 * Save list of posts to a CSV file
 */
export function toCSV(posts, filePath) {
    const parser = new json2csv.Parser({fields});
    const csv = parser.parse(posts);
    fs.writeFileSync(filePath, csv);
}

/**
 * Save list of posts to a JSON file
 */
export function toJSON(posts, filePath) {
    fs.writeFileSync(filePath, JSON.stringify(posts));
}
