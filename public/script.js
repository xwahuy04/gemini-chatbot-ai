// Menyimpan riwayat percakapan (multi-turn conversation)
const conversation = [];

const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Hapus simbol markdown dari teks
function stripMarkdown(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold** -> bold
        .replace(/\*(.+?)\*/g, '$1')         // *italic* -> italic
        .replace(/`(.+?)`/g, '$1')           // `code` -> code
        .replace(/^#{1,6}\s+/gm, '')         // # heading -> heading
        .replace(/^[-*]\s+/gm, '- ')        // list item tetap ada tanda strip
        .trim();
}

// Fungsi menampilkan pesan di layar
function addMessage(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role);
    messageDiv.textContent = (role === 'model') ? stripMarkdown(text) : text;
    chatMessages.appendChild(messageDiv);

    // Auto-scroll ke bawah
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
}

// Fungsi mengirim pesan ke backend
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Tampilkan pesan user
    addMessage('user', text);

    // Tambahkan ke history conversation (format multi-turn)
    conversation.push({ role: 'user', text });

    // Reset input & disable button
    userInput.value = '';
    sendBtn.disabled = true;

    // Tampilkan loading indicator
    const thinkingDiv = addMessage('thinking', 'TactiQ sedang menganalisis...');

    try {
        // Kirim POST request ke backend
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation })
        });

        const data = await response.json();

        // Hapus loading indicator
        thinkingDiv.remove();

        if (response.ok) {
            // Tampilkan balasan dari Gemini
            addMessage('model', data.result);

            // Tambahkan balasan ke history conversation
            conversation.push({ role: 'model', text: data.result });
        } else {
            addMessage('model', 'Terjadi kesalahan: ' + data.error);
        }
    } catch (error) {
        thinkingDiv.remove();
        addMessage('model', 'Gagal terhubung ke server. Coba lagi.');
    }

    sendBtn.disabled = false;
    userInput.focus();
}

// Event: klik tombol kirim
sendBtn.addEventListener('click', sendMessage);

// Event: tekan Enter untuk kirim
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});
