/**
 * SPCA Shelter-Side Clinic Scheduling
 * -----------------------------------
 * Main entry point for the Shelter-Side appointment web app.
 * 
 * Responsibilities:
 *  • Serve the main HTML UI via doGet()
 *  • Provide the include() helper for partial HTML injection
 * 
 * Notes:
 *  • Unlike the Grant Scheduler, this app does not use pre-set appointment slots.
 *  • Appointments are surgery-only and appended directly to the sheet.
 */

/**
 * Serve the main HTML interface.
 * Optionally accepts ?page= param for deep-linking (future use).
 */
function doGet(e) {
  const tpl = HtmlService.createTemplateFromFile('Index');
  tpl.page = (e && e.parameter && e.parameter.page) || '';
  return tpl
    .evaluate()
    .setTitle('Shelter-Side Clinic Scheduling');
}

/**
 * include(filename)
 * -----------------
 * Safely inlines UI partials into HtmlService templates.
 * Usage: <?!= include('ui/js.utils'); ?>
 *
 * Accepts paths with or without ".html" extension.
 */
function include(filename) {
  try {
    let path = filename.trim().replace(/^\/*/, ''); // strip leading slashes
    if (!path.endsWith('.html')) path += '.html';

    const file = HtmlService.createHtmlOutputFromFile(path);
    const content = file.getContent();
    if (!content) throw new Error('File found but empty.');

    return content;

  } catch (err) {
    Logger.log(`❌ include("${filename}") failed: ${err.message || err}`);
    // Return harmless HTML comment so the UI still renders
    return `<!-- include error: ${filename} (${err.message || err}) -->`;
  }
}