import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 1. Firebase 구성 설정 (Firebase 콘솔 발급 키로 교체)
const firebaseConfig = {
   apiKey: "AIzaSyCxMuz_dLoXTkPFIhIWFjMpakE8w6G1eGU",
  authDomain: "myproject-894cb.firebaseapp.com",
  projectId: "myproject-894cb",
  storageBucket: "myproject-894cb.firebasestorage.app",
  messagingSenderId: "931629057270",
  appId: "1:931629057270:web:a921999be0988a905818d7",
  databaseURL: "https://myproject-894cb-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 2. 공공데이터포털 TourAPI 일반 인증키
const TOUR_API_KEY = "bd21b12db0e288c3985b09ce34dad04c43e57ea2693be743697926278f106d4d";

// 3. 브라우저 로컬 식별자 생성/조회
let userKey = localStorage.getItem("travel_user_id");
if (!userKey) {
  userKey = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("travel_user_id", userKey);
}

const selectEl = document.getElementById("area-select");
const containerEl = document.getElementById("card-container");
const statusMsgEl = document.getElementById("status-msg");

// 공공데이터 TourAPI 호출 및 목록 렌더링
async function loadTourData(areaCode) {
  statusMsgEl.innerText = "관광 정보를 불러오는 중입니다...";
  const endpoint = `https://apis.data.go.kr/B551011/KorService2/areaBasedList2?serviceKey=${TOUR_API_KEY}&numOfRows=12&pageNo=1&MobileOS=ETC&MobileApp=CardBook&_type=json&areaCode=${areaCode}`;
  try {
    const response = await fetch(endpoint);
    const data = await response.json();
    const items = data?.response?.body?.items?.item;

    if (!items || items.length === 0) {
      statusMsgEl.innerText = "조회된 관광지 데이터가 없습니다.";
      containerEl.style.display = "none";
      return;
    }

    renderCards(items);
    statusMsgEl.innerText = "";
    containerEl.style.display = "grid";
  } catch (error) {
    console.error("API Fetch Error:", error);
    statusMsgEl.innerText = "관광지 데이터를 가져오는 중 오류가 발생했습니다.";
  }
}

// 카드 렌더링
function renderCards(items) {
  containerEl.innerHTML = "";
  items.forEach(item => {
    const imageUrl = item.firstimage || item.firstimage2 || "https://via.placeholder.com/300x180?text=No+Image";
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${imageUrl}" alt="${item.title}" loading="lazy">
      <div class="card-content">
        <h2 class="card-title">${item.title}</h2>
        <p class="card-addr">${item.addr1 || "주소 정보 없음"}</p>
      </div>
    `;
    containerEl.appendChild(card);
  });
}

// Firebase 저장 및 지속 업데이트
async function saveUserArea(areaCode) {
  try {
    await set(ref(db, `users/${userKey}`), {
      selectedArea: areaCode,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Firebase Save Error:", err);
  }
}

// 페이지 초기 진입 시 Firebase 상태 확인
async function initPage() {
  try {
    const snapshot = await get(ref(db, `users/${userKey}/selectedArea`));
    if (snapshot.exists()) {
      const savedArea = snapshot.val();
      selectEl.value = savedArea;
      loadTourData(savedArea);
    } else {
      containerEl.style.display = "none";
      statusMsgEl.innerText = "지역을 선택하면 관광지가 표시됩니다.";
    }
  } catch (err) {
    console.error("Firebase Read Error:", err);
  }
}

// 드롭다운 변경 리스너
selectEl.addEventListener("change", (e) => {
  const areaCode = e.target.value;
  if (!areaCode) {
    containerEl.style.display = "none";
    statusMsgEl.innerText = "지역을 선택해주세요.";
    return;
  }
  loadTourData(areaCode);
  saveUserArea(areaCode);
});

initPage();
