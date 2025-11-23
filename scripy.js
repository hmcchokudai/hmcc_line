// --- 設定項目 ---
const LIFF_ID = "2008166327-NVge42LW"; 

// GAS URL群
const GAS_URL_EVENT_REGISTER = "https://script.google.com/macros/s/AKfycbxN47CVAu6CXVCwgtvWlTKavmfFxgeWxBwKCkIq7I2bHv8jHt3uZwTNsjVgNyZoOrJd/exec"; 
const GAS_URL_ADD_POINT = "https://script.google.com/macros/s/AKfycbxWtpYlUi7giPbO_8NjGkKAcf1HGLauGJPp8PQOZaTyNJ6Idg7RsuHFeAAOvSEPAEhD/exec"; 
const GAS_URL_MEMBERSHIP = "https://script.google.com/macros/s/AKfycbxWtpYlUi7giPbO_8NjGkKAcf1HGLauGJPp8PQOZaTyNJ6Idg7RsuHFeAAOvSEPAEhD/exec"; 
// --- 設定はここまで --

document.addEventListener('DOMContentLoaded', () => {
    main();
});

async function main() {
    document.getElementById('loading-view').style.display = 'block';

    try {
        await liff.init({ liffId: LIFF_ID });
        
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        const eventId = urlParams.get('eventId'); // membershipの時はnullでもOK

        // actionに応じて分岐
        if (action === 'register' && eventId) {
            setupEventRegistrationForm(eventId);
        } else if (action === 'addPoint' && eventId) {
            await processPointAddition(eventId);
        } else if (action === 'membership') {
            setupMembershipForm();
        } else {
            // パラメータ不備、あるいはQRコード読み取り以外で開いた場合など
            document.body.innerHTML = "<div class='container'><div class='card'><h2>Error</h2><p>Invalid URL parameters.</p></div></div>";
        }

    } catch (error) {
        console.error(error);
        alert('LIFF initialization failed.');
    } finally {
        document.getElementById('loading-view').style.display = 'none';
    }
}

// --- A. イベント申込フォーム ---
function setupEventRegistrationForm(eventId) {
    document.getElementById('form-view').style.display = 'block';

    const form = document.getElementById('application-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const profile = await liff.getProfile();
        const formData = new FormData(form);
        const formProps = Object.fromEntries(formData);
        
        // "Other"入力値の統合
        if (formProps.howDidYouKnow === 'Other' && formProps.howDidYouKnowOther) formProps.howDidYouKnow = formProps.howDidYouKnowOther;
        if (formProps.reason === 'Other' && formProps.reasonOther) formProps.reason = formProps.reasonOther;

        const submissionData = {
            action: 'register',
            userId: profile.userId,
            displayName: profile.displayName,
            eventId: eventId,
            ...formProps
        };

        sendRequest(GAS_URL_EVENT_REGISTER, submissionData);
        
        document.getElementById('form-view').style.display = 'none';
        document.getElementById('complete-title').innerText = "Application Complete";
        document.getElementById('complete-view').style.display = 'block';
    });
}

// --- B. ポイント加算処理 ---
async function processPointAddition(eventId) {
    document.getElementById('add-point-view').style.display = 'block';

    const profile = await liff.getProfile();
    const pointData = {
        action: 'addPoint',
        userId: profile.userId,
        eventId: eventId
    };

    sendRequest(GAS_URL_ADD_POINT, pointData);
}

// --- C. 会員登録フォーム ---
function setupMembershipForm() {
    document.getElementById('membership-view').style.display = 'block';

    const form = document.getElementById('membership-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 送信ボタン連打防止
        const btn = form.querySelector('button');
        btn.disabled = true;
        btn.innerText = "Processing...";

        try {
            const profile = await liff.getProfile();
            const formData = new FormData(form);
            const formProps = Object.fromEntries(formData);

            // "Other"入力値の統合
            if (formProps.nationality === 'Other' && formProps.nationalityOther) formProps.nationality = formProps.nationalityOther;
            if (formProps.university === 'Other' && formProps.universityOther) formProps.university = formProps.universityOther;
            if (formProps.source === 'Other' && formProps.sourceOther) formProps.source = formProps.sourceOther;

            const submissionData = {
                action: 'membership_register',
                userId: profile.userId,
                displayName: profile.displayName,
                ...formProps
            };

            sendRequest(GAS_URL_MEMBERSHIP, submissionData);

            document.getElementById('membership-view').style.display = 'none';
            document.getElementById('complete-title').innerText = "Registration Complete";
            document.getElementById('complete-view').style.display = 'block';

        } catch (err) {
            console.error(err);
            alert("Error retrieving profile.");
            btn.disabled = false;
        }
    });
}

// --- データ送信 (no-cors) ---
function sendRequest(url, data) {
    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
    }).catch(error => {
        console.error("Fetch error:", error);
    });
}