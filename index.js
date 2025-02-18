const ggApiKey = "AIzaSyDK1lg01u_1Hs-I9_qWy6u0jcdF9r4IQKQ";
const ggSearch = `https://www.googleapis.com/customsearch/v1?key=${ggApiKey}&cx=81f7f798f04c748c6&q=dime+app+minimum+requirements+Android+iOS`;
// const gplay = require("google-play-scraper");
import gplay from "google-play-scraper";
import db from "./db.js";
async function checkDeviceSupport(appName) {
  try {
    // 🔍 ค้นหาแอปตามชื่อ0
    const results = await gplay.search({ term: appName, num: 1 });

    if (results.length === 0) {
      console.log("ไม่พบแอปที่คุณต้องการ");
      return;
    }

    const appId = results[0].appId; // ดึง appId ของแอปแรก
    console.log(`🔍 พบแอป: ${results[0].title} (${appId})`);

    // 📥 ดึงรายละเอียดแอป
    const app = await gplay.app({ appId });
    const detail = {
      androidVersion: app.androidVersion,
      title: app.title,
      summary: app.summary,
    };
    return detail;
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    throw error;
  }
}
const aiEndPoint = "http://localhost:7000/api";
const llmModel = "deepseek-r1:14b";
const imageModel = "LLaVA:7B";

async function askAiText(prompt, moreRule = "", adminPrompt = "") {
  const systemPrompt = `คุณพนักงานบริการช่วยเหลือลูกค้าที่รักเเละให้บริการลูกค้าด้วยความเป็นมิตร 💙 
    คุณต้องตอบเป็น **ภาษาไทย** เท่านั้น ห้ามใช้ภาษาอื่น! เราจะมีกฏตามนี้
    1.กรณีหากลูกค้าสอบถามเกี่ยวกับแอปพลิเคชัน หรือหากคุณไม่มั่นใจว่ามันคือแอพลิเคชั่นหรือป่าว คุณสามารถส่งชื่อที่ลูกค้ากรอกมาให้เราไปค้นหาให้ได้
    คุณต้องตอบว่า: ขอข้อมูลแอปพลิเคชัน ตามด้วยชื่อแอพลิเคชั่น เพื่อที่ฉันจะไปหาข้อมูลมาตอบให้คุณ 
    แล้วให้คุณไปตอบลูกค้า หากเป็นถามเกี่ยวกับการเข้ากันได้ระหว่างแอพลิเคชั่นเเละสินค้าของเรา 
    คุณไม่ได้ต้องคิดมากหรือประมวลผลมาก คุณเเค่บอกชื่อรุ่นมาเราจะไปค้นหามาให้ 
    ตัวอย่างเช่น ใช้ dime ได้ไหม คุณจะตอบมาเเค่ว่า 'ขอข้อมูลแอปพลิเคชัน dime' 
    โดยจะไม่มีการตอบนอกเหนือจากนี้ ไม่มีการทักทายใดๆ 
    2.กรณีที่ฉันเอาข้อมูลแอพลิเคชั่นมาให้เเล้ว ฉันจะเอาข้อมูลส่งมาพร้อมคำถามลูกค้าอีกรอบเพื่อให้คุณวิเคราะห์ ในข้อนี้คุณสามารถตอบได้ตามปกติเลย
    3.ถ้ากรณีทั่วไปไม่ได้สอบถามเเอพลิเคชั่นคุณสามารถตอบได้ตามปกติเลย รายละเอียดอื่นๆเพิ่มเติม ${(moreRule =
      "" ? "ไม่มี" : moreRule)}`;

  const requestBody = {
    model: llmModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
      { role: "assistant", content: adminPrompt },
    ],
    stream: false,
  };
  console.log(requestBody);
  const result = await fetch(`${aiEndPoint}/chat`, {
    body: JSON.stringify(requestBody),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  }).then((x) => x.json());
  return result.message.content;
}

function splitThink(message) {
  return message.replace(/<think>.*?<\/think>/gs, "").trim();
}

async function askAiIamge(images) {
  const result = await fetch(`${aiEndPoint}`, {
    body: {
      model: llmModel,
      prompt: "what is image please describe",
      stream: false,
      images: [...images],
    },
    method: "POST",
  });
  return result;
}

async function main() {
  const database = db();
  const rawData = await database.getRawData();
  const purchase = await database.getPurchaseData();
  const product = await database.getProductData();

  const start = new Date();
  const customerAsk = "ใช้ scb ได้ไหม";
  const resultAi = await askAiText(customerAsk, "ใช้กฏข้อที่ 1");
  const end = new Date();
  console.log(splitThink(resultAi));
  console.log((end.getTime() - start.getTime()) / 1000);
  const text = splitThink(resultAi);
  const match = text.match(/^ขอข้อมูลแอปพลิเคชัน (.+)/);

  if (match) {
    const nameApplication = match[1];
    const detail = await checkDeviceSupport(nameApplication);
    const resultAi = await askAiText(
      `${customerAsk} `,
      `นี่คือผลลัพธ์ที่คุณเคยร้องขอเกี่ยวกับแอพลิเคชั่น title: ${detail.title} summary: ${detail.summary} androidVersion: ${detail.androidVersion}`,
      ``
    );
    console.log(splitThink(resultAi));
  }
}
// 📌 ฟังก์ชันเปรียบเทียบเวอร์ชัน
function compareVersions(userVersion, minVersion) {
  const userParts = userVersion.split(".").map(Number);
  const minParts = minVersion.split(".").map(Number);

  for (let i = 0; i < Math.max(userParts.length, minParts.length); i++) {
    const userNum = userParts[i] || 0;
    const minNum = minParts[i] || 0;
    if (userNum > minNum) return true;
    if (userNum < minNum) return false;
  }
  return true;
}

// 🔥 ทดสอบโค้ด
main();
// getAppInfo("com.dime.app"); // เปลี่ยนเป็น Package ID ของแอปที่ต้องการดึงข้อมูล

// fetch(ggSearch)
//   .then((x) => x.json())
//   .then((x) => {
//     const searchResult = x.items.map((g) => `${g.htmlTitle} ${g.htmlSnippet}`);
//     console.log(searchResult);
//   });
