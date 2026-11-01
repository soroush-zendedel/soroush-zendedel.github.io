(function () {
  const storageKey = 'preferred-site-language';
  const dismissedKey = 'language-suggestion-dismissed';
  const currentLanguage = document.documentElement.lang.toLowerCase().startsWith('fa') ? 'fa' : 'en';
  const alternateLanguage = currentLanguage === 'fa' ? 'en' : 'fa';
  const browserLanguages = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || ''];
  const browserLanguage = browserLanguages
    .map((language) => language.toLowerCase().split('-')[0])
    .find((language) => language === 'fa' || language === 'en');
  const preferredLanguage = browserLanguage || (currentLanguage === 'fa' ? 'en' : null);
  let prompt = null;

  function rememberLanguage(language) {
    try {
      localStorage.setItem(storageKey, language);
      localStorage.removeItem(dismissedKey);
    } catch (_) {
      // Language switching still works when browser storage is unavailable.
    }
  }

  document.querySelectorAll('a[hreflang="fa"], a[hreflang="en"]').forEach((link) => {
    link.addEventListener('click', () => {
      rememberLanguage(link.hreflang.toLowerCase().startsWith('fa') ? 'fa' : 'en');
    });
  });

  function getLanguageSwitcher(languageLink) {
    let languageSwitcher = languageLink.closest('.language-switcher');
    if (!languageSwitcher) {
      languageSwitcher = document.createElement('div');
      languageSwitcher.className = 'language-switcher';
      languageLink.replaceWith(languageSwitcher);
      languageSwitcher.append(languageLink);
    }
    return languageSwitcher;
  }

  function showSuggestion(language, forced = false) {
    if (!language || (prompt && prompt.isConnected)) return;
    if (!forced) {
      try {
        if (localStorage.getItem(storageKey) || localStorage.getItem(dismissedKey)) return;
      } catch (_) {
        // Continue with the browser-language suggestion when storage is unavailable.
      }
    }

    const languageLink = document.querySelector('a[hreflang="' + language + '"]');
    if (!languageLink) return;
    const languageSwitcher = getLanguageSwitcher(languageLink);
    const currentPrompt = document.createElement('aside');
    currentPrompt.className = 'language-suggestion';
    currentPrompt.lang = language;
    currentPrompt.dir = document.documentElement.dir || (currentLanguage === 'fa' ? 'rtl' : 'ltr');
    currentPrompt.setAttribute('aria-label', language === 'fa' ? 'پیشنهاد زبان' : 'Language suggestion');

    const preferredDirection = language === 'fa' ? 'rtl' : 'ltr';
    const message = document.createElement('p');
    message.lang = language;
    message.dir = preferredDirection;
    message.textContent = language === 'fa'
      ? forced
        ? 'نسخهٔ فارسی سایت را ببینید؟'
        : 'به نظر می‌رسد زبان مرورگرتان فارسی است. نسخهٔ فارسی را ببینید؟'
      : forced
        ? 'Would you like to view the English version?'
        : browserLanguage === 'en'
          ? 'Your browser appears to use English. Would you like to view the English version?'
          : 'This site is also available in English. Would you like to view the English version?';

    const action = document.createElement('a');
    action.href = languageLink.href;
    action.hreflang = language;
    action.lang = language;
    action.dir = preferredDirection;
    action.className = 'language-suggestion__action';
    action.textContent = language === 'fa' ? 'نمایش نسخهٔ فارسی' : 'View English version';
    action.addEventListener('click', () => rememberLanguage(language));

    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'language-suggestion__dismiss';
    dismiss.setAttribute('aria-label', language === 'fa' ? 'بستن پیشنهاد زبان' : 'Dismiss language suggestion');
    dismiss.textContent = '×';
    dismiss.addEventListener('click', () => {
      try { localStorage.setItem(dismissedKey, '1'); } catch (_) { /* Ignore unavailable storage. */ }
      currentPrompt.remove();
      if (prompt === currentPrompt) prompt = null;
    });

    currentPrompt.append(message, action, dismiss);
    languageSwitcher.append(currentPrompt);
    prompt = currentPrompt;
  }

  document.addEventListener('site-tour', () => showSuggestion(alternateLanguage, true));

  if (preferredLanguage && preferredLanguage !== currentLanguage) showSuggestion(preferredLanguage);
})();
