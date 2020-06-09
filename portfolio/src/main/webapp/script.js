// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* Global variables to support comment pagination */
let pageNum = 0;
let numComments = 5;
let pageCursor = null;
let cursorList = [null];
let order = 'newest';

/**
 * Adds a random fact to the page.
 */
function addRandomFact() {
  const facts = [
    'I love hot cheetos.',
    'Purple is my favorite color.',
    'I\'m horrible at remembering song lyrics.',
    'I speak some French.',
  ];

  // Pick a random fact.
  const fact = facts[Math.floor(Math.random() * facts.length)];

  // Add it to the page.
  const factContainer = document.getElementById('fact-container');
  factContainer.innerText = fact;
}

/**
 * Shows the specified blog post to the user
 * @param {number} postNum The number of which
 * blog post to show.
 */
function showBlogPost(postNum) {
  // Find the correct triangle to expand and switch its image.
  // Also change the onclick function for this button to hide the post.
  const buttonId = 'expandTriangle' + postNum;
  const button = document.getElementById(buttonId);
  if (button !== null) {
    button.src = '/images/downtriangle.jpeg';
    button.onclick = function() {
      hideBlogPost(postNum);
    };
  }

  // Show blog post content in the correct area.
  const blogPostId = 'blogPost' + postNum;
  const postArea = document.getElementById(blogPostId);
  if (postArea !== null) {
    postArea.style.display = 'block';
  }

  // Automatically scroll window with post now opened.
  window.scrollBy(0, 500);
}

/**
 * Hides the specified blog post from the user
 * @param {number} postNum The number of which
 * blog post to hide.
 */
function hideBlogPost(postNum) {
  // Find the correct triangle to hide and switch its image.
  // Also change the onclick function for this button to show the post.
  const buttonId = 'expandTriangle' + postNum;
  const button = document.getElementById(buttonId);
  if (button !== null) {
    button.src = '/images/righttriangle.jpeg';
    button.onclick = function() {
      showBlogPost(postNum);
    };
  }

  // Hide blog post content from its area.
  const blogPostId = 'blogPost' + postNum;
  const postArea = document.getElementById(blogPostId);
  if (postArea !== null) {
    postArea.style.display = 'none';
  }
}

/**
 * Gets the comments using the GetCommentsServlet
 * and adds them to the site interface. Supports
 * pagination between to see all comments.
 */
async function getComments() {
  // Reset pageCursor to the one for this page before fetching
  if (pageNum >= 0 && pageNum < cursorList.length) {
    pageCursor = cursorList[pageNum];
  }

  // Fetch comments from servlet
  const responsePath = '/get-comments?order=' + order +
      '&pageCursor=' + pageCursor + '&num=' + numComments;
  const response = await fetch(responsePath);
  const resp = await response.json();

  const commentArea = document.getElementById('comment-space');
  if (commentArea !== null && resp.comments !== null) {
    if (pageNum >= (cursorList.length - 1)) {
      // Just went to a page not seen before: add its
      // cursor to the end of the array
      cursorList.push(resp.nextPageCursor);
    }
    pageCursor = cursorList[pageNum];

    // Retrieve and parse comments JSON from get-comments response
    let comments = resp.comments;
    comments = JSON.parse(comments);
    if (comments.length === 0 || comments === '') {
      // At the end: no more comments
      pageNum = pageNum - 1;
      return;
    }

    // Clear comment area in case page is being reloaded
    commentArea.innerHTML = '';

    // Append current comments to page
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      const commentElement = createCommentElement(comment);
      commentArea.appendChild(commentElement);
    }
  }
}

/**
 * Retrieve the number of comments to display from the
 * drop-down menu, and re-load comments.
 */
function changeNumComments() {
  // Get the newly selected number from the drop-down
  const num = document.getElementById('numComments');
  if (num !== null) {
    numComments = num.options[num.selectedIndex].text;
    // Parse String to int
    numComments = parseInt(numComments);
    if (isNaN(numComments)) {
      // Default to 5 comments
      numComments = 5;
    }
  } else {
    // Default to show 5 comments
    numComments = 5;
  }

  // Reset page back to beginning
  cursorList = [null];
  pageNum = 0;
  pageCursor = null;
  getComments();
}

/**
 * Retrieve the order of comments to display from the
 * drop-down menu, and re-load comments.
 */
function changeCommentOrder() {
  // Get the newly selected order from the drop-down
  order = getCommentOrder();
  if (order == null) {
    // If could not find comment order, default to newest first
    order = 'newest';
  }

  // Reset page back to beginning
  cursorList = [null];
  pageNum = 0;
  pageCursor = null;
  getComments();
}

/**
 * Retrieve the comment order to display from the
 * drop-down menu.
 * @return {String} the order requested for comment
 * viewing, or null if it was not found.
 */
function getCommentOrder() {
  // Get the selected number from the dropdown
  const order = document.getElementById('commentOrder');
  if (order !== null) {
    return order.options[order.selectedIndex].value;
  }
  return null;
}

/**
 * Submit a comment using form fields using the
 * DataServlet, and reload comments.
 */
async function submitComment() {
  const text = document.getElementById('userComment').value;
  const name = document.getElementById('userName').value;
  const responsePath = '/data?text=' + text + '&name=' + name;
  fetch(responsePath);

  // Reset page back to beginning
  cursorList = [null];
  pageNum = 0;
  pageCursor = null;
  getComments();
}

/**
 * Delete a comment using its id and the
 * DeleteCommentServlet.
 */
async function deleteComment(comment) {
  const params = new URLSearchParams();
  params.append('id', comment.id);
  fetch('/delete-comment', {method: 'POST', body: params});

  // Reset page back to beginning
  cursorList = [null];
  pageNum = 0;
  pageCursor = null;
  getComments();
}

/**
 * Convert a Javascript Date to the AM/PM
 * format desired.
 * @return {String} the Date formatted in
 * MM/DD/YYYY, Hr:Min am/pm
 */
function toAmPmTimestamp(date) {
  const hour = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
  const minute = '0' + date.getMinutes();
  const label = date.getHours() > 12 ? 'pm' : 'am';
  let formatted = date.toLocaleDateString();
  formatted = formatted + ', ' + hour + ':' + minute.substr(-2) + label;
  return formatted;
}

/**
 * Moves to next page and gets/displays
 * comments for the new page.
 */
function advancePage() {
  pageNum = pageNum + 1;
  getComments();
}

/**
 * Moves to the previous page if not currently at
 * the beginning of pages, and gets/displays
 * comments for the new page.
 */
function previousPage() {
  pageNum = pageNum - 1 >= 0 ? pageNum - 1 : 0;
  getComments();
}

/**
 * Creates an element for a comment, including its delete button.
 */
function createCommentElement(comment) {
  // Article tag to encapsulate comment elements
  const commentElement = document.createElement('article');
  commentElement.className = 'comment';

  // Bold tag for the username
  const username = document.createElement('b');
  const usernameStr = comment.username + ':';
  username.innerText = usernameStr;

  // Timestamp
  const date = new Date(comment.timestamp);
  const formatted = toAmPmTimestamp(date);

  // Span tag for the comment text
  const commentText = document.createElement('span');
  // Make sure to escape comment input for HTML tags
  const escapeDiv = document.createElement('div');
  escapeDiv.innerText = comment.text;
  const html = ' ' + escapeDiv.innerHTML + '\n <i>' + formatted + '</i>';
  commentText.innerHTML = html;

  // Delete button for each comment
  const deleteButton = document.createElement('button');
  deleteButton.innerText = 'Delete';
  deleteButton.className = 'buttonSmall';
  deleteButton.addEventListener('click', () => {
    // Delete function to remove this comment from Datastore
    deleteComment(comment);

    // Remove the comment from the DOM
    commentElement.remove();
  });


  // Append username, text, and delete button to overall element
  commentElement.appendChild(username);
  commentElement.appendChild(commentText);
  commentElement.appendChild(deleteButton);
  return commentElement;
}
