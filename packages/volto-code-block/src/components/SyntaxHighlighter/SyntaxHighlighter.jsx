import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import config from '@plone/volto/registry';

import cx from 'classnames';

import 'prismjs/plugins/toolbar/prism-toolbar';
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard';
import 'prismjs/plugins/line-numbers/prism-line-numbers';

const SyntaxHighlighter = (props) => {
  const { language, code, showLineNumbers, lineNbr } = props;
  const preRef = useRef(null);
  const hasHighlightedRef = useRef(false);
  const className = cx(`language-${language}`, {
    'line-numbers': showLineNumbers,
  });
  const allLanguages = config.settings.codeBlock.languages;

  useEffect(() => {
    const preElement = preRef.current;
    if (!preElement) return;

    Prism.languages[language] = allLanguages[language].language;

    // Function to perform highlighting
    const performHighlight = () => {
      const codeElement = preElement.querySelector('code');
      if (codeElement) {
        Prism.highlightElement(codeElement);
        hasHighlightedRef.current = true;
      }
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
          // When element becomes visible and has non-zero dimensions
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

    // Also watch for resize events (e.g., accordion opening)
    const resizeObserver = new ResizeObserver(() => {
      if (isVisible() && showLineNumbers) {
        // Small delay to ensure layout is stable
        setTimeout(performHighlight, 0);
      }
    });

    resizeObserver.observe(preElement);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [allLanguages, language, showLineNumbers]);

  return (
    <pre ref={preRef} className={className} data-start={lineNbr}>
      <code data-prismjs-copy-timeout="300">{code}</code>
    </pre>
  );
};

export default SyntaxHighlighter;
