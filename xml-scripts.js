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
    url: 'https://smileschool-api.hbtn.info/xml/quotes',
    method: 'GET',
    dataType: 'xml',
    success: function (xml) {
      let carouselItems = '';
      $(xml).find('quote').each(function (index) {
        const pic_url = $(this).find('pic_url').text();
        const name = $(this).find('name').text();
        const title = $(this).find('title').text();
        const text = $(this).find('text').text();
        const activeClass = index === 0 ? 'active' : '';
        carouselItems += `
          <div class="carousel-item ${activeClass}">
            <div class="row mx-auto align-items-center">
              <div class="col-12 col-sm-2 col-lg-2 offset-lg-1 text-center">
                <img src="${pic_url}" class="d-block align-self-center" alt="${name}" />
              </div>
              <div class="col-12 col-sm-7 offset-sm-2 col-lg-9 offset-lg-0">
                <div class="quote-text">
                  <p class="text-white">« ${text}</p>
                  <h4 class="text-white font-weight-bold">${name}</h4>
                  <span class="text-white">${title}</span>
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


  const videosLoop = [...videos, ...videos, ...videos];
  const startIndex = videos.length;


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


  function updateCardWidths() {
    const visibleCards = getVisibleCards();
    const cardWidth = 100 / visibleCards;
    $row.find('.video-card-wrapper').css('width', cardWidth + '%');
  }

  updateCardWidths();


  $carousel.carousel('dispose');


  function updateCarouselPosition(animate = true) {
    const visibleCards = getVisibleCards();
    const cardPercentage = 100 / visibleCards;
    const translateX = -(currentIndex * cardPercentage);

    $row.css('transition', animate ? 'transform 0.6s ease' : 'none');
    $row.css('transform', `translateX(${translateX}%)`);
  }


  setTimeout(function () {
    updateCarouselPosition(false);
  }, 100);


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
   PARSE VIDEO XML NODE TO JS OBJECT
===================================================== */
function parseVideoNode(node) {
  return {
    title: $(node).find('title').text(),
    'sub-title': $(node).find('sub-title').text(),
    thumb_url: $(node).find('thumb_url').text(),
    author: $(node).find('author').text(),
    author_pic_url: $(node).find('author_pic_url').text(),
    duration: $(node).find('duration').text(),
    star: parseInt($(node).attr('star'), 10)
  };
}

/* =====================================================
   POPULAR TUTORIALS
===================================================== */
function loadPopularTutorials() {
  $('#popular-loader').show();
  $('#carouselExampleControls2').hide();

  $.ajax({
    url: 'https://smileschool-api.hbtn.info/xml/popular-tutorials',
    method: 'GET',
    dataType: 'xml',
    success: function (xml) {
      const videos = [];
      $(xml).find('video').each(function () {
        videos.push(parseVideoNode(this));
      });
      createSlidingCarousel('#carouselExampleControls2', videos);
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
    url: 'https://smileschool-api.hbtn.info/xml/latest-videos',
    method: 'GET',
    dataType: 'xml',
    success: function (xml) {
      const videos = [];
      $(xml).find('video').each(function () {
        videos.push(parseVideoNode(this));
      });
      createSlidingCarousel('#carouselExampleControls3', videos);
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
    url: 'https://smileschool-api.hbtn.info/xml/courses',
    method: 'GET',
    data: { q: searchValue, topic: currentTopic, sort: currentSort },
    dataType: 'xml',
    success: function (xml) {
      const $xml = $(xml);

      // Parse topics
      if ($('#topic-menu').children().length === 0) {
        const topics = [];
        $xml.find('topics > topic').each(function () {
          topics.push($(this).text());
        });
        populateTopics(topics);
      }

      // Parse sorts
      if ($('#sort-menu').children().length === 0) {
        const sorts = [];
        $xml.find('sorts > sort').each(function () {
          sorts.push($(this).text());
        });
        populateSorts(sorts);
      }

      // Parse q
      const q = $xml.find('result > q').text();
      if (q && $('#search-input').val() === '') {
        $('#search-input').val(q);
      }

      // Parse courses
      const courses = [];
      $xml.find('course').each(function () {
        courses.push({
          title: $(this).find('title').text(),
          'sub-title': $(this).find('sub-title').text(),
          thumb_url: $(this).find('thumb_url').text(),
          author: $(this).find('author').text(),
          author_pic_url: $(this).find('author_pic_url').text(),
          duration: $(this).find('duration').text(),
          star: parseInt($(this).attr('star'), 10)
        });
      });

      displayCourses(courses);

      const videoCount = courses.length;
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
