import youtubedl from "youtube-dl-exec";
import fs from "fs";
import path from "path";

async function run() {
  const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
  const tmpBase = `sub_test_${Date.now()}`;
  
  console.time("Subtitle Download");
  try {
    await (youtubedl as any)(url, {
      skipDownload: true,
      writeAutoSubs: true,
      writeSubs: true,
      subLangs: "pt",
      output: `tmp/${tmpBase}.%(lang)s.%(ext)s`,
      noWarnings: true,
      noCheckCertificates: true,
      addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0'],
    });
    console.timeEnd("Subtitle Download");
    
    const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(tmpBase));
    console.log("Downloaded files:", files);
    
    // Clean up
    for (const file of files) {
      fs.unlinkSync(path.join(tmpDir, file));
    }
  } catch (err: any) {
    console.timeEnd("Subtitle Download");
    console.error("Error downloading subtitles:", err.message);
  }
}

run();
