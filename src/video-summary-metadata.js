const fs = require('fs/promises');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const VIDEO_DIR = path.join(ROOT_DIR, 'video');
const OUTPUT_FILE = path.join(VIDEO_DIR, 'all-videos.md');

/**
 * Recursively find all markdown files under a directory.
 * Returns absolute file paths.
 */
async function findMarkdownFilesRecursively(startDirectory) {
  const results = [];

  async function walk(currentDirectory) {
    const dirents = await fs.readdir(currentDirectory, { withFileTypes: true });
    for (const dirent of dirents) {
      const fullPath = path.join(currentDirectory, dirent.name);
      if (dirent.isDirectory()) {
        await walk(fullPath);
      } else if (dirent.isFile()) {
        if (
          fullPath.toLowerCase().endsWith('.md') &&
          path.resolve(fullPath) !== path.resolve(OUTPUT_FILE)
        ) {
          results.push(fullPath);
        }
      }
    }
  }

  await walk(startDirectory);
  return results;
}

function deriveFolderName(markdownFilePath) {
  const parentDirectory = path.dirname(markdownFilePath);
  const relativeToVideo = path.relative(VIDEO_DIR, parentDirectory);
  if (!relativeToVideo || relativeToVideo === '') {
    return 'video';
  }
  // Use the immediate parent directory name
  const parts = relativeToVideo.split(path.sep).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : 'video';
}

function deriveVideoName(markdownFilePath) {
  const baseName = path.basename(markdownFilePath, '.md');
  // Common pattern: C0014-analysis.md -> C0014
  if (baseName.toLowerCase().endsWith('-analysis')) {
    return baseName.slice(0, -'-analysis'.length);
  }
  return baseName;
}

function formatSection({ folderName, videoName, content }) {
  // Divider + header line with folder and video name, then the original content
  return [
    '=======',
    `Video folder: ${folderName}`,
    `Video name: ${videoName}`,
    '',
    content.trim(),
    ''
  ].join('\n');
}

async function buildAllVideosMarkdown() {
  // Ensure the input directory exists
  try {
    await fs.access(VIDEO_DIR);
  } catch {
    throw new Error(`Input directory not found: ${VIDEO_DIR}`);
  }

  const markdownFiles = await findMarkdownFilesRecursively(VIDEO_DIR);

  if (markdownFiles.length === 0) {
    const emptyMessage = '=======\nNo markdown files found under video/.';
    await fs.writeFile(OUTPUT_FILE, emptyMessage, 'utf8');
    return { writtenTo: OUTPUT_FILE, count: 0 };
  }

  // Sort by relative path for deterministic output
  markdownFiles.sort((a, b) => a.localeCompare(b));

  const sections = [];
  for (const filePath of markdownFiles) {
    const content = await fs.readFile(filePath, 'utf8');
    const folderName = deriveFolderName(filePath);
    const videoName = deriveVideoName(filePath);
    const section = formatSection({ folderName, videoName, content });
    sections.push(section);
  }

  const finalOutput = sections.join('\n');
  await fs.writeFile(OUTPUT_FILE, finalOutput, 'utf8');

  return { writtenTo: OUTPUT_FILE, count: markdownFiles.length };
}

if (require.main === module) {
  buildAllVideosMarkdown()
    .then(({ writtenTo, count }) => {
      // eslint-disable-next-line no-console
      console.log(`Wrote ${count} section(s) to: ${path.relative(ROOT_DIR, writtenTo)}`);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error);
      process.exit(1);
    });
}

module.exports = { buildAllVideosMarkdown };


