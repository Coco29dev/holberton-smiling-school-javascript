$(document).ready(function () {
  if (window.location.pathname.includes('courses')) {
    loadCourses();
  } else {
    loadQuotes();
    if ($('#carouselExampleControls2').length) {
      loadPopularTutorials();
    }
    if ($('#carouselExampleControls3').length) {
      loadLatestVideos();
    }
  }
});

/* =====================================================
   QUOTES CAROUSEL
===================================================== */
function loadQuotes() {
  $('.loader').show();
  $('#carouselExampleControls').hide();

  $.ajax({
    url: 'https://smileschool-api.hbtn.info/quotes',
    method: 'GET',
    dataType: 'json',
    success: function (data) {
      let carouselItems = '';
      data.forEach(function (quote, index) {
        const activeClass = index === 0 ? 'active' : '';
        carouselItems += `
          <div class="carousel-item ${activeClass}">
            <div class="row mx-auto align-items-center">
              <div class="col-12 col-sm-2 col-lg-2 offset-lg-1 text-center">
                <img src="${quote.pic_url}" class="d-block align-self-center" alt="${quote.name}" />
              </div>
              <div class="col-12 col-sm-7 offset-sm-2 col-lg-9 offset-lg-0">
                <div class="quote-text">
                  <p class="text-white">« ${quote.text}</p>
                  <h4 class="text-white font-weight-bold">${quote.name}</h4>
                  <span class="text-white">${quote.title}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      });

      $('#carouselExampleControls .carousel-inner').html(carouselItems);
      $('.loader').hide();
      $('#carouselExampleControls').show();
    },
    error: function (error) {
      console.error('Erreur quotes:', error);
      $('.loader').hide();
    }
  });
}

/* =====================================================
   GENERIC SLIDING CARD CAROUSEL
   Uses CSS translateX for smooth card-by-card animation.
   Videos are tripled for seamless infinite looping.

   @param {string} carouselId  - CSS selector of the carousel element
   @param {Array}  videos      - array of video objects from the API
===================================================== */
function getVisibleCards() {
  const width = $(window).width();
  if (width < 576) return 1;
  if (width < 992) return 2;
  return 4;
}

function createSlidingCarousel(carouselId, videos) {
  const $carousel = $(carouselId);
  const $inner = $carousel.find('.carousel-inner');
  let currentIndex = 0;

  // Triple the videos array for infinite looping
  const videosLoop = [...videos, ...videos, ...videos];
  const startIndex = videos.length;

  // Build one single carousel-item containing all cards in a flex row
  let allCardsHTML =
    '<div class="carousel-item active">' +
    '<div class="row flex-nowrap" style="transition: transform 0.6s ease; margin: 0;">';

  videosLoop.forEach(function (video) {
    let starsHtml = '';
    for (let k = 1; k <= 5; k++) {
      const starImage = k <= video.star ? 'star_on.png' : 'star_off.png';
      starsHtml += `<img src="images/${starImage}" alt="star" width="15px" />`;
    }

    allCardsHTML += `
      <div class="video-card-wrapper" style="width: 100%; flex-shrink: 0; padding: 0 10px;">
        <div class="card">
          <img src="${video.thumb_url}" class="card-img-top" alt="${video.title}" />
          <div class="card-img-overlay text-center">
            <img src="images/play.png" alt="Play" width="64px" class="align-self-center play-overlay" />
          </div>
          <div class="card-body">
            <h5 class="card-title font-weight-bold">${video.title}</h5>
            <p class="card-text text-muted">${video['sub-title']}</p>
            <div class="creator d-flex align-items-center">
              <img src="${video.author_pic_url}" alt="${video.author}" width="30px" class="rounded-circle" />
              <h6 class="pl-3 m-0 main-color">${video.author}</h6>
            </div>
            <div class="info pt-3 d-flex justify-content-between">
              <div class="rating">${starsHtml}</div>
              <span class="main-color">${video.duration}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  allCardsHTML += '</div></div>';
  $inner.html(allCardsHTML);

  const $row = $inner.find('.row');
  currentIndex = startIndex;

  // Set each card's width based on how many should be visible
  function updateCardWidths() {
    const visibleCards = getVisibleCards();
    const cardWidth = 100 / visibleCards;
    $row.find('.video-card-wrapper').css('width', cardWidth + '%');
  }

  updateCardWidths();

  // Remove Bootstrap's carousel JS so our handlers take over
  $carousel.carousel('dispose');

  // Move the row via CSS transform
  function updateCarouselPosition(animate = true) {
    const visibleCards = getVisibleCards();
    const cardPercentage = 100 / visibleCards;
    const translateX = -(currentIndex * cardPercentage);

    $row.css('transition', animate ? 'transform 0.6s ease' : 'none');
    $row.css('transform', `translateX(${translateX}%)`);
  }

  // Initial position (no animation)
  setTimeout(function () {
    updateCarouselPosition(false);
  }, 100);

  // Next button: advance one card, wrap around if needed
  $carousel.find('.carousel-control-next').off('click').on('click', function (e) {
    e.preventDefault();
    currentIndex++;
    updateCarouselPosition(true);

    if (currentIndex >= videos.length * 2) {
      setTimeout(function () {
        currentIndex = videos.length;
        updateCarouselPosition(false);
      }, 600);
    }
  });

  // Prev button: go back one card, wrap around if needed
  $carousel.find('.carousel-control-prev').off('click').on('click', function (e) {
    e.preventDefault();
    currentIndex--;
    updateCarouselPosition(true);

    if (currentIndex < videos.length) {
      setTimeout(function () {
        currentIndex = videos.length * 2 - 1;
        updateCarouselPosition(false);
      }, 600);
    }
  });

  // Recalculate card widths and position on resize (debounced)
  let resizeTimer;
  $(window).on('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      updateCardWidths();
      updateCarouselPosition(false);
    }, 250);
  });
}

/* =====================================================
   POPULAR TUTORIALS
===================================================== */
function loadPopularTutorials() {
  $('#popular-loader').show();
  $('#carouselExampleControls2').hide();

  $.ajax({
    url: 'https://smileschool-api.hbtn.info/popular-tutorials',
    method: 'GET',
    dataType: 'json',
    success: function (data) {
      createSlidingCarousel('#carouselExampleControls2', data);
      $('#popular-loader').hide();
      $('#carouselExampleControls2').show();
    },
    error: function (error) {
      console.error('Erreur popular tutorials:', error);
      $('#popular-loader').hide();
    }
  });
}

/* =====================================================
   LATEST VIDEOS
===================================================== */
function loadLatestVideos() {
  $('#latest-loader').show();
  $('#carouselExampleControls3').hide();

  $.ajax({
    url: 'https://smileschool-api.hbtn.info/latest-videos',
    method: 'GET',
    dataType: 'json',
    success: function (data) {
      createSlidingCarousel('#carouselExampleControls3', data);
      $('#latest-loader').hide();
      $('#carouselExampleControls3').show();
    },
    error: function (error) {
      console.error('Erreur latest videos:', error);
      $('#latest-loader').hide();
    }
  });
}

/* =====================================================
   COURSES
===================================================== */
let currentTopic = '';
let currentSort = 'most_popular';
let searchTimeout;

function loadCourses() {
  const searchValue = $('#search-input').val();

  $('#courses-loader').show();
  $('#results-container').hide();

  $.ajax({
    url: 'https://smileschool-api.hbtn.info/courses',
    method: 'GET',
    data: { q: searchValue, topic: currentTopic, sort: currentSort },
    dataType: 'json',
    success: function (data) {
      if ($('#topic-menu').children().length === 0) populateTopics(data.topics);
      if ($('#sort-menu').children().length === 0) populateSorts(data.sorts);

      if (data.q && $('#search-input').val() === '') {
        $('#search-input').val(data.q);
      }

      displayCourses(data.courses);

      const videoCount = data.courses.length;
      $('#video-count').text(videoCount + (videoCount === 1 ? ' video' : ' videos'));

      $('#courses-loader').hide();
      $('#results-container').show();
    },
    error: function (error) {
      console.error('Erreur cours:', error);
      $('#courses-loader').hide();
    }
  });
}

function populateTopics(topics) {
  let topicsHtml = '';
  topics.forEach(function (topic) {
    const topicValue = topic.toLowerCase() === 'all' ? '' : topic;
    topicsHtml += `<a class="dropdown-item" href="#" data-topic="${topicValue}">${topic}</a>`;
  });
  $('#topic-menu').html(topicsHtml);

  $('#topic-menu .dropdown-item').on('click', function (e) {
    e.preventDefault();
    currentTopic = $(this).data('topic');
    $('#topic-selected').text($(this).text());
    loadCourses();
  });
}

function populateSorts(sorts) {
  let sortsHtml = '';
  sorts.forEach(function (sort) {
    const sortName = sort
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    sortsHtml += `<a class="dropdown-item" href="#" data-sort="${sort}">${sortName}</a>`;
  });
  $('#sort-menu').html(sortsHtml);

  $('#sort-menu .dropdown-item').on('click', function (e) {
    e.preventDefault();
    currentSort = $(this).data('sort');
    $('#sort-selected').text($(this).text());
    loadCourses();
  });
}

function displayCourses(courses) {
  let coursesHtml = '';
  courses.forEach(function (course) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      const starImage = i <= course.star ? 'star_on.png' : 'star_off.png';
      starsHtml += `<img src="images/${starImage}" alt="star" width="15px" />`;
    }

    coursesHtml += `
      <div class="col-12 col-sm-4 col-lg-3 d-flex justify-content-center">
        <div class="card">
          <img src="${course.thumb_url}" class="card-img-top" alt="Video thumbnail" />
          <div class="card-img-overlay text-center">
            <img src="images/play.png" alt="Play" width="64px" class="align-self-center play-overlay" />
          </div>
          <div class="card-body">
            <h5 class="card-title font-weight-bold">${course.title}</h5>
            <p class="card-text text-muted">${course['sub-title']}</p>
            <div class="creator d-flex align-items-center">
              <img src="${course.author_pic_url}" alt="${course.author}" width="30px" class="rounded-circle" />
              <h6 class="pl-3 m-0 main-color">${course.author}</h6>
            </div>
            <div class="info pt-3 d-flex justify-content-between">
              <div class="rating">${starsHtml}</div>
              <span class="main-color">${course.duration}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  $('#courses-grid').html(coursesHtml);
}

$('#search-input').on('input', function () {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(function () {
    loadCourses();
  }, 500);
});
