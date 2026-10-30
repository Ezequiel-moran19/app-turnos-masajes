import { test, expect } from '@playwright/test';

test('identifica elementos que generan desbordamiento horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const overflowingElements = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;

    return Array.from(document.querySelectorAll('body *'))
      .map((element) => {
        const rect = element.getBoundingClientRect();

        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === 'string'
            ? element.className
            : '',
          id: element.id,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((element) => element.right > viewportWidth + 1);
  });

  console.log('Elementos que desbordan:', overflowingElements);

  expect(overflowingElements.length).toBe(0);
});