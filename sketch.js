// ...existing code...
let questions = [];
let quiz = [];
let currentIndex = 0;
let score = 0;
let state = 'intro'; // intro, quiz, result
let buttons = [];
let startBtn, downloadBtn, retryBtn;
let messageDiv;
let particles = [];
let bgNoise = [];
let cnv;

function setup() {
  // 全螢幕畫布
  select('body').style('margin', '0');
  cnv = createCanvas(windowWidth, windowHeight);
  cnv.position(0, 0);
  cnv.style('display', 'block');

  textFont('Arial');

  // 預生成背景噪點位置（輕微紋理）
  for (let i = 0; i < 200; i++) {
    bgNoise.push({
      x: random(width),
      y: random(height),
      r: random(0.5, 2.5),
      a: random(8, 28)
    });
  }

  initQuestionBank();
  createUI();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  cnv.position(0, 0);
  // 重新產生噪點以符合新尺寸
  bgNoise = [];
  for (let i = 0; i < 200; i++) {
    bgNoise.push({
      x: random(width),
      y: random(height),
      r: random(0.5, 2.5),
      a: random(8, 28)
    });
  }
  repositionUI();
}

function draw() {
  drawBackground();
  drawBackgroundParticles();
  fill(255);
  noStroke();
  if (state === 'intro') {
    drawIntro();
  } else if (state === 'quiz') {
    drawQuestion();
  } else if (state === 'result') {
    drawResult();
  }
  updateParticles();
}

/* ---------- 題庫與 UI ---------- */

function initQuestionBank() {
   // p5.js 題庫（可擴充）
  questions = [
    {id:1, q:"p5.js 程式中，setup() 的主要用途為何？", choices:["每個 frame 都執行一次","只在程式開始時執行一次","處理滑鼠事件","載入外部資源用"], a:1, fb:"setup() 在程式開始時執行一次，常用來建立畫布與初始化設定。"},
    {id:2, q:"draw() 函式在 p5.js 中的行為是？", choices:["只執行一次","每秒執行一次固定次數","每個 frame 持續執行","只在滑鼠點擊時執行"], a:2, fb:"draw() 預設每個 frame 執行（連續更新畫面），frameRate 可調整速率。"},
    {id:3, q:"createCanvas(400, 300) 定義的是？", choices:["畫布的像素寬高","背景顏色","字型大小","座標原點"], a:0, fb:"createCanvas(width, height) 用來建立畫布並設定其像素寬高。"},
    {id:4, q:"若要在載入圖檔前等待，應該使用哪個函式？", choices:["preload()","setup()","draw()","loadImage()"], a:0, fb:"preload() 用來載入外部資源（如圖、音）並確保載入完成後再執行 setup()。"},
    {id:5, q:"在畫布上改變塗色應先呼叫哪個函式？", choices:["stroke()","fill()","background()","noLoop()"], a:1, fb:"fill() 設定形狀的填滿顏色；stroke() 設定邊線顏色，兩者順序會影響渲染。"},
    {id:6, q:"rectMode(CENTER) 的效果是？", choices:["矩形用中心點繪製","矩形以左上角繪製","矩形以右下角繪製","矩形會自動縮放"], a:0, fb:"rectMode(CENTER) 使 rect() 的 x,y 為矩形中心點，預設是 CORNER（左上角）。"},
    {id:7, q:"使用 push() / pop() 的主要目的是？", choices:["加速運算","建立變數作用域","限制變換（translate/rotate）的影響範圍","清除畫布"], a:2, fb:"push()/pop() 保存與還原樣式與變換狀態，常用於局部 translate/rotate。"},
    {id:8, q:"random(10, 20) 會回傳什麼？", choices:["介於 0 與 10 的值","介於 10 與 20 的隨機浮點數","永遠為整數 10 或 20","回傳陣列"], a:1, fb:"random(min, max) 回傳落在 min（含）與 max（不含）之間的隨機浮點數，若需整數可用 floor()/int()。"},
    {id:9, q:"哪個函式可讓 draw() 停止持續執行？", choices:["noLoop()","stop()","pause()","frameRate(0)"], a:0, fb:"呼叫 noLoop() 可停止重複執行 draw()；之後可用 loop() 恢復。"},
    {id:10, q:"在 p5.js 中要建立 HTML 按鈕通常使用？", choices:["createCanvas()","createButton()","select()","button()"], a:1, fb:"createButton() 用來建立 DOM 按鈕，可搭配 mousePressed() 等事件。"}
  ];
}

function createUI() {
  // 清理舊 DOM（保留 canvas）
  selectAll('button').forEach(b => b.remove());
  selectAll('div').forEach(d => {
    if (!d.elt || (cnv && d.elt.id === cnv.elt.id)) return;
    d.remove();
  });

  let padX = width * 0.04;
  let btnY = height - Math.max(90, height * 0.08);

  // 大按鈕樣式
  let btnStyle = (btn) => {
    btn.style('font-size', String(Math.max(18, width * 0.018)) + 'px');
    btn.style('padding', '12px 18px');
    btn.style('border-radius', '10px');
    btn.style('background-color', '#ffffffcc');
    btn.style('color', '#222');
    btn.style('border', 'none');
    btn.style('cursor', 'pointer');
  };

  startBtn = createButton('開始測驗');
  startBtn.position(padX, btnY);
  startBtn.mousePressed(startQuiz);
  btnStyle(startBtn);

  downloadBtn = createButton('下載題庫 CSV');
  downloadBtn.position(padX + (width * 0.22), btnY);
  downloadBtn.mousePressed(downloadCSV);
  btnStyle(downloadBtn);

  retryBtn = createButton('重新作答');
  retryBtn.position(padX + (width * 0.44), btnY);
  retryBtn.mousePressed(() => {
    startQuiz();
  });
  btnStyle(retryBtn);

  messageDiv = createDiv('');
  messageDiv.position(padX, btnY - 68);
  messageDiv.style('color', '#fff');
  messageDiv.style('max-width', String(width * 0.9) + 'px');
  messageDiv.style('font-size', String(Math.max(16, width * 0.016)) + 'px');
  messageDiv.style('background', 'rgba(0,0,0,0.25)');
  messageDiv.style('padding', '8px 12px');
  messageDiv.style('border-radius', '8px');
}

function repositionUI() {
  if (!startBtn) return;
  let padX = width * 0.04;
  let btnY = height - Math.max(90, height * 0.08);
  startBtn.position(padX, btnY);
  downloadBtn.position(padX + (width * 0.22), btnY);
  retryBtn.position(padX + (width * 0.44), btnY);
  messageDiv.position(padX, btnY - 68);
  messageDiv.style('max-width', String(width * 0.9) + 'px');

  // 重新擺放選項按鈕（若已建立）
  for (let i = 0; i < buttons.length; i++) {
    let bx = width * 0.52;
    let by = height * 0.20 + i * (height * 0.11);
    buttons[i].position(bx, by);
    buttons[i].size(width * 0.42, Math.max(48, height * 0.08));
    buttons[i].style('font-size', String(Math.max(18, width * 0.018)) + 'px');
  }
}

function startQuiz() {
  // 亂數抽題
  quiz = shuffleArray(questions).slice(0, 4);
  currentIndex = 0;
  score = 0;
  state = 'quiz';
  messageDiv.html('');
  buttons.forEach(b => b.remove());
  buttons = [];
  createChoiceButtons();
}

function createChoiceButtons() {
  buttons.forEach(b => b.remove());
  buttons = [];
  for (let i = 0; i < 4; i++) {
    let b = createButton('');
    let bx = width * 0.52;
    let by = height * 0.20 + i * (height * 0.11);
    b.position(bx, by);
    b.size(width * 0.42, Math.max(48, height * 0.08));
    b.mousePressed(() => handleChoice(i));
    // 按鈕視覺效果
    b.style('font-size', String(Math.max(18, width * 0.018)) + 'px');
    b.style('text-align', 'left');
    b.style('padding-left', '18px');
    b.style('border-radius', '10px');
    b.style('background-color', '#ffffffcc');
    b.style('color', '#111');
    b.style('border', 'none');
    buttons.push(b);
  }
  updateChoiceButtons();
}

function updateChoiceButtons() {
  if (state !== 'quiz') return;
  let item = quiz[currentIndex];
  for (let i = 0; i < 4; i++) {
    buttons[i].html(String.fromCharCode(65 + i) + '. ' + item.choices[i]);
  }
}

/* ---------- 畫面與互動 ---------- */

function drawBackground() {
  // 漸層與柔和光暈
  let c1 = color(18, 22, 50);
  let c2 = color(35, 60, 110);
  let c3 = color(60, 120, 170);
  // 上到下三段漸層
  for (let y = 0; y < height; y++) {
    let t = map(y, 0, height, 0, 1);
    let col = lerpColor(lerpColor(c1, c2, t), c3, t * 0.6);
    stroke(red(col), green(col), blue(col));
    line(0, y, width, y);
  }

  // 柔光中心
  noStroke();
  blendMode(ADD);
  let glow = color(255, 255, 220, 18);
  fill(glow);
  ellipse(width * 0.15, height * 0.18, width * 0.6, height * 0.6);
  blendMode(BLEND);

  // 背景噪點（紋理）
  for (let i = 0; i < bgNoise.length; i++) {
    let n = bgNoise[i];
    fill(255, n.a);
    ellipse((n.x + sin(frameCount * 0.002 + i) * 6) % width, (n.y + cos(frameCount * 0.001 + i) * 6) % height, n.r);
  }
}

function drawBackgroundParticles() {
  // 微動態背景點（延展到整個畫面） — 輕微流動
  for (let i = 0; i < 80; i++) {
    let x = (i * 123 + frameCount * 0.6 * (i % 3 + 1)) % width;
    let y = 40 + (i * 71 + frameCount * 0.2) % (height - 80);
    fill(255, 255, 255, 6 + (i % 7));
    ellipse(x, y, 6, 6);
  }
}

function drawIntro() {
  push();
  fill(255);
  textSize(Math.max(36, width * 0.04));
  textStyle(BOLD);
  text('p5.js隨機測驗（每次 4 題）', width * 0.05, height * 0.12);
  textStyle(NORMAL);
  textSize(Math.max(18, width * 0.02));
  text('按「開始測驗」抽題並作答。完成後會顯示成績與回饋。', width * 0.05, height * 0.18, width * 0.44);
  pop();
}

function drawQuestion() {
  let item = quiz[currentIndex];
  push();
  fill(245);
  textSize(Math.max(20, width * 0.025));
  textAlign(LEFT, TOP);
  text('題目 ' + (currentIndex + 1) + ' / ' + quiz.length, width * 0.05, height * 0.06);
  textSize(Math.max(22, width * 0.028));
  text(item.q, width * 0.05, height * 0.12, width * 0.44, height * 0.6);

  // 進度視覺化（左側）
  let px = width * 0.05;
  let py = height * 0.75;
  let barW = width * 0.44;
  stroke(255, 80);
  strokeWeight(2);
  noFill();
  rect(px, py - 10, barW, 18, 8);
  noStroke();
  fill(120, 220, 180, 180);
  let w = map(currentIndex, 0, quiz.length, 0, barW);
  rect(px, py - 10, w, 18, 8);

  pop();
}

function handleChoice(choiceIndex) {
  let item = quiz[currentIndex];
  let correct = (choiceIndex === item.a);
  if (correct) {
    score++;
    spawnParticles(true);
  } else {
    spawnParticles(false);
  }
  messageDiv.html((correct ? '<strong>答對！</strong> ' : '<strong>答錯。</strong> ') + item.fb);
  setTimeout(() => {
    currentIndex++;
    messageDiv.html('');
    if (currentIndex >= quiz.length) {
      state = 'result';
      buttons.forEach(b => b.hide());
    } else {
      updateChoiceButtons();
    }
  }, 900);
}

function drawResult() {
  push();
  fill(255);
  textSize(Math.max(32, width * 0.04));
  textAlign(LEFT, TOP);
  text('測驗結果', width * 0.05, height * 0.08);
  textSize(Math.max(20, width * 0.025));
  text('得分: ' + score + ' / ' + quiz.length, width * 0.05, height * 0.15);

  let pct = Math.round((score / quiz.length) * 100);
  let fb = feedbackForScore(pct);
  textSize(Math.max(20, width * 0.024));
  text('正確率: ' + pct + '%', width * 0.05, height * 0.20);
  text('回饋: ' + fb, width * 0.05, height * 0.26, width * 0.45);

  // 右側豐富化動畫
  let cx = width * 0.74;
  let cy = height * 0.38;

  if (pct >= 90) {
    // 大型獎盃 + 繽紛爆發
    push();
    translate(cx, cy);
    rotate(sin(frameCount * 0.02) * 0.06);
    fill(255, 220, 80);
    stroke(220, 180, 50);
    strokeWeight(3);
    ellipse(-10, -10, width * 0.22, height * 0.21);
    fill(250, 245, 200);
    noStroke();
    rect(-40, 10, 80, 28, 8);
    fill(255, 210, 60);
    ellipse(0, -10, width * 0.12, height * 0.12); // trophy head
    pop();
    // 繽紛彩帶
    for (let i = 0; i < 40; i++) {
      stroke((i * 57) % 255, (i * 97) % 255, (i * 37) % 255, 220);
      strokeWeight(3);
      noFill();
      let tx = cx + cos((frameCount * 0.08 + i) * 0.4) * (width * 0.2) * (i % 3 ? 0.9 : 1.1);
      let ty = cy + sin((frameCount * 0.06 + i) * 0.3) * (height * 0.12);
      point(tx, ty);
    }
  } else if (pct >= 65) {
    // 中等表現：圓形動態與漸變塊
    noStroke();
    for (let r = 0; r < 6; r++) {
      fill(80, 200, 255, 220 - r * 30);
      ellipse(cx + sin(frameCount * 0.02 + r) * (width * 0.03), cy + r * (height * 0.02), Math.max(14, width * 0.02 + r * 3));
    }
    fill(100, 220, 200, 220);
    rect(cx - 60, cy + 80, width * 0.22, height * 0.14, 14);
  } else {
    // 低分：鼓勵風格，溫和動畫且顯示建議（建議文字在框內）
    noStroke();
    fill(255, 110, 110, 120);
    for (let i = 0; i < 8; i++) {
      triangle(cx - 40 + i * (width * 0.012), cy + 60, cx - 34 + i * (width * 0.012), cy + 30, cx - 28 + i * (width * 0.012), cy + 60);
    }

    // 建議文字框（確保文字在框內）
    let boxX = cx - 80;
    let boxY = cy + 100;
    let boxW = width * 0.26;
    let boxH = height * 0.12;
    fill(255, 235, 220, 200);
    stroke(200, 180, 160, 160);
    strokeWeight(1.5);
    rect(boxX, boxY, boxW, boxH, 12);
    noStroke();
    fill(48);
    textSize(Math.max(14, width * 0.014));
    textAlign(LEFT, TOP);
    // 文字內距
    let pad = Math.min(18, boxW * 0.06);
    text('建議：再多練習，特別注意基礎概念與單位。可重讀相關章節並實作範例，加深理解與印象。☺️', boxX + pad, boxY + pad, boxW - pad * 2, boxH - pad * 2);
  }

  // 大型百分比數字（中央偏右）
  fill(255, 245, 200);
  textSize(Math.max(48, width * 0.06));
  textAlign(CENTER, CENTER);
  text(pct + '%', width * 0.74, height * 0.66);

  pop();
}

/* ---------- 回饋與 CSV ---------- */

function feedbackForScore(pct) {
  if (pct === 100) return "太棒了！完全答對，繼續保持！😍";
  if (pct >= 75) return "表現良好，但還有進步空間。😉";
  if (pct >= 50) return "基礎概念掌握，但建議再複習。🥰";
  return "多做練習並複習相關知識再挑戰一次。🥹";
}

function downloadCSV() {
  // 產生 CSV 內容
  let lines = [];
  lines.push(['id','question','choiceA','choiceB','choiceC','choiceD','answerIndex','feedback'].join(','));
  questions.forEach(q => {
    let row = [
      q.id,
      '"' + q.q.replace(/"/g, '""') + '"',
      '"' + q.choices[0].replace(/"/g, '""') + '"',
      '"' + q.choices[1].replace(/"/g, '""') + '"',
      '"' + q.choices[2].replace(/"/g, '""') + '"',
      '"' + q.choices[3].replace(/"/g, '""') + '"',
      q.a,
      '"' + q.fb.replace(/"/g, '""') + '"'
    ];
    lines.push(row.join(','));
  });
  let csv = lines.join('\r\n');
  let blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  let url = URL.createObjectURL(blob);
  let a = createA(url, 'download');
  a.attribute('download', 'question_bank.csv');
  a.elt.click();
  URL.revokeObjectURL(url);
  a.remove();
}

/* ---------- 工具 ---------- */

function shuffleArray(arr) {
  let copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ----------------- 進階粒子/動畫效果 ----------------- */

function spawnParticles(correct) {
  if (correct) {
    // 繽紛彩帶 + 星星
    for (let i = 0; i < 40; i++) {
      particles.push({
        type: 'confetti',
        x: width * 0.74 + random(-40, 40),
        y: height * 0.38 + random(-40, 40),
        vx: random(-6, 6),
        vy: random(-8, -2),
        life: random(60, 140),
        size: random(6, 16),
        color: color(random(40, 255), random(80, 255), random(80, 255))
      });
    }
    for (let i = 0; i < 18; i++) {
      particles.push({
        type: 'spark',
        x: width * 0.74 + random(-20, 20),
        y: height * 0.38 + random(-20, 20),
        vx: random(-3, 3),
        vy: random(-5, -1),
        life: random(40, 90),
        size: random(4, 10),
        color: color(255, 230, 120)
      });
    }
  } else {
    // 溫和煙霧 + 小碎片
    for (let i = 0; i < 26; i++) {
      particles.push({
        type: 'smoke',
        x: width * 0.74 + random(-30, 30),
        y: height * 0.38 + random(-10, 30),
        vx: random(-1.5, 1.5),
        vy: random(-1.5, -0.2),
        life: random(60, 120),
        size: random(20, 60),
        color: color(60, 60, 80, 180)
      });
    }
    for (let i = 0; i < 12; i++) {
      particles.push({
        type: 'shard',
        x: width * 0.74 + random(-40, 40),
        y: height * 0.38 + random(-40, 40),
        vx: random(-4, 4),
        vy: random(-6, -2),
        life: random(50, 100),
        size: random(6, 12),
        color: color(255, 130, 130)
      });
    }
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    // 微重力與擴散
    if (p.type === 'confetti') {
      p.vy += 0.12;
      p.vx *= 0.995;
      p.life--;
      push();
      translate(p.x, p.y);
      rotate((frameCount + i) * 0.07);
      noStroke();
      fill(p.color.levels[0], p.color.levels[1], p.color.levels[2], map(p.life, 0, 140, 0, 255));
      rect(0, 0, p.size, p.size * 0.5);
      pop();
    } else if (p.type === 'spark') {
      p.vy += 0.08;
      p.life--;
      noStroke();
      fill(p.color.levels[0], p.color.levels[1], p.color.levels[2], map(p.life, 0, 90, 0, 255));
      ellipse(p.x, p.y, p.size, p.size);
    } else if (p.type === 'smoke') {
      p.vy -= 0.03; // 上升
      p.life--;
      let alpha = map(p.life, 0, 120, 0, 120);
      noStroke();
      fill(red(p.color), green(p.color), blue(p.color), alpha * 0.9);
      ellipse(p.x, p.y, p.size * (1 + (120 - p.life) / 60), p.size * 0.6 * (1 + (120 - p.life) / 80));
    } else if (p.type === 'shard') {
      p.vy += 0.15;
      p.life--;
      noStroke();
      fill(p.color.levels[0], p.color.levels[1], p.color.levels[2], map(p.life, 0, 100, 0, 220));
      push();
      translate(p.x, p.y);
      rotate((frameCount + i) * 0.1);
      triangle(-p.size/2, p.size/2, p.size/2, p.size/2, 0, -p.size/2);
      pop();
    }

    if (p.life <= 0) particles.splice(i, 1);
  }
}