export const copyToClipboard = async (value) => {
    try {
        await navigator.clipboard.writeText(value);

    } catch (err) {
        console.error('Не удалось спопировать:', err);

        const textArea = document.createElement('textarea');
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

const COPY_LINK_SELECTOR = '.copy-link';
const COPY_LINK_LABEL_SELECTOR = '.contact-link_label';

const $copyLinks = document.querySelectorAll(COPY_LINK_SELECTOR);
$copyLinks.forEach($link => {
    $link.addEventListener('click', async (event) => {
        event.preventDefault();

        const copyValue = $link.getAttribute('data-copy-link-value');
        if (!copyValue) {
            console.error('data-copy-link-value не найден');
            return;
        }

        copyToClipboard(copyValue);

        const $linkLabel = $link.querySelector(COPY_LINK_LABEL_SELECTOR);
        if(!$linkLabel) {
            return;
        }

        const originalText = $linkLabel.textContent;
        $linkLabel.textContent = 'Скопировано!';
        $linkLabel.style.opacity = '0.7';

        setTimeout(() => {
            $linkLabel.textContent = originalText;
            $linkLabel.style.opacity = '1';
        }, 1500);
    });
});
