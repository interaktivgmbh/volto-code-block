import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import config from '@plone/volto/registry';

import cx from 'classnames';

import 'prismjs/plugins/toolbar/prism-toolbar';
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard';
import 'prismjs/plugins/line-numbers/prism-line-numbers';

const SyntaxHighlighter = (props) => {
  const { language, code, showLineNumbers, lineNbr } = props;
  const preRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  const allLanguages = config.settings.codeBlock.languages;

  // Mark component as mounted after first render (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Don't run on server or before first client render (avoid hydration mismatch)
    if (!mounted) return;

    const preElement = preRef.current;
    if (!preElement) return;

    const codeElement = preElement.querySelector('code');
    if (!codeElement) return;

    // Ensure language is loaded
    if (language && allLanguages[language]) {
      Prism.languages[language] = allLanguages[language].language;
    }

    // Function to perform highlighting on this specific element
    const performHighlight = () => {
      // Remove any existing Prism classes and line numbers to reset state
      codeElement.className = '';
      codeElement.removeAttribute('class');

      // Remove line-numbers-rows if it exists
      const existingRows = preElement.querySelector('.line-numbers-rows');
      if (existingRows) {
        existingRows.remove();
      }

      // Set the code content
      codeElement.textContent = code;

      // Apply the correct classes to pre element
      const preClassName = cx(`language-${language}`, {
        'line-numbers': showLineNumbers,
      });
      preElement.className = preClassName;

      // Apply the correct class to code element before highlighting
      codeElement.className = `language-${language}`;

      // Highlight this specific element
      Prism.highlightElement(codeElement);
    };

    // Check if element is visible (not display: none)
    const isVisible = () => {
      return preElement.offsetParent !== null;
    };

    // Initial highlight if visible
    if (isVisible()) {
      performHighlight();
    }

    // Use IntersectionObserver to detect when element becomes visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When element becomes visible
          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            // Re-highlight to fix line numbers
            performHighlight();
          }
        });
      },
      {
        threshold: 0.01, // Trigger as soon as element is slightly visible
      }
    );

    observer.observe(preElement);

    // Also watch for resize events (e.g., accordion opening with CSS transitions)
    const resizeObserver = new ResizeObserver(() => {
      if (isVisible() && showLineNumbers) {
        // Small delay to ensure layout is stable after accordion animation
        setTimeout(performHighlight, 50);
      }
    });

    resizeObserver.observe(preElement);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [allLanguages, language, showLineNumbers, code, mounted]);

  return (
    <pre
      ref={preRef}
      data-start={lineNbr}
    >
      <code data-prismjs-copy-timeout="300">
        {code}
      </code>
    </pre>
  );
};

export default SyntaxHighlighter;
