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
let atBeginning = true;
let atEnd = false;

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
  let commentOrder = getCommentOrder();
  if (commentOrder == null) {
    // If could not find comment order, default to newest first
    commentOrder = 'newest';
  }

  // Fetch comments from servlet
  const responsePath = '/get-comments?order=' + commentOrder;
  const response = await fetch(responsePath);
  const comments = await response.json();

  const commentArea = document.getElementById('comment-space');
  if (commentArea !== null && comments !== null) {
    // Clear comment area in case page is being reloaded
    commentArea.innerHTML = '';

    // Calculate which comments to start and end at
    const start = pageNum * numComments;
    const end = (start + numComments) >= comments.length ? comments.length :
                                                           start + numComments;
    // Update globals and button appearances
    if (start === 0) {
      atBeginning = true;
      document.getElementById('prevButton').className = 'unavailableButton';
    } else {
      atBeginning = false;
      document.getElementById('prevButton').className = 'availableButton';
    }
    if (end === comments.length) {
      atEnd = true;
      document.getElementById('nextButton').className = 'unavailableButton';
    } else {
      atEnd = false;
      document.getElementById('nextButton').className = 'availableButton';
    }

    for (let i = start; i < end; i++) {
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
  // Start the page back at 0
  pageNum = 0;

  // Get the newly selected number from the dropdown
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
 * Delete a comment using its id and the
 * DeleteCommentServlet.
 */
async function deleteComment(comment) {
  const params = new URLSearchParams();
  params.append('id', comment.id);
  fetch('/delete-comment', {method: 'POST', body: params});
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
  const month = date.getMonth() + 1;
  const day = date.getDay();
  const year = date.getFullYear();
  const hour = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
  const minute = '0' + date.getMinutes();
  const label = date.getHours() > 12 ? 'pm' : 'am';
  const formatted = month + '/' + day + '/' + year + ', ' + hour + ':' +
      minute.substr(-2) + label;

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

/**
 * Moves to next page if not currently at the end of
 * pages, and gets/displays comments for the new page.
 */
function advancePage() {
  if (!atEnd) {
    pageNum = pageNum + 1;
    getComments();
  }
}

/**
 * Moves to the previous page if not currently at
 * the beginning of pages, and gets/displays
 * comments for the new page.
 */
function previousPage() {
  if (!atBeginning) {
    pageNum = pageNum - 1;
    getComments();
  }
}

/**
 * Retrieve the number of comments to display from the
 * drop-down menu.
 * @return {number} the number of comments requested,
 * or -1 if it could not be found.
 */
function getNumComments() {
  // Get the selected number from the dropdown
  const num = document.getElementById('numComments');
  if (num !== null) {
    let numComments = num.options[num.selectedIndex].text;

    // Parse String to int to return
    numComments = parseInt(numComments);
    if (!isNaN(numComments)) {
      return numComments;
    }
    return -1;
  }
  return -1;
}

/**
 * Delete a comment using its id and the
 * DeleteCommentServlet.
 */
async function deleteComment(comment) {
  const params = new URLSearchParams();
  params.append('id', comment.id);
  fetch('/delete-comment', {method: 'POST', body: params});
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

  // Span tag for the comment text
  const text = document.createElement('span');
  text.innerText = comment.text;

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
  commentElement.appendChild(text);
  commentElement.appendChild(deleteButton);
  return commentElement;
}
