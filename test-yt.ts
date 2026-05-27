import youtubedl from "youtube-dl-exec";
import fs from "fs";

console.log("Starting dl...");
const stream = youtubedl.exec("https://www.youtube.com/watch?v=H64QG4UsrGI", {
  o: '-',
  f: 'best',
});

if (stream && stream.stdout) {
  stream.stdout.pipe(fs.createWriteStream("test.mp4"));
  stream.on('close', () => console.log("Done"));
}
