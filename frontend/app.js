(function () {
  'use strict';

  var API_BASE = (window.location.origin + '/api/prompts').replace(/\/+$/, '');

  angular
    .module('promptLibraryApp', ['ngRoute'])
    .config(routeConfig)
    .constant('API_BASE', API_BASE)
    .service('PromptApi', PromptApi)
    .controller('PromptController', PromptController);

  routeConfig.$inject = ['$routeProvider'];
  function routeConfig($routeProvider) {
    $routeProvider
      .when('/prompts', {
        templateUrl: 'list-view.html'
      })
      .when('/prompt-by-id', {
        templateUrl: 'detail-view.html'
      })
      .when('/create', {
        templateUrl: 'create-view.html'
      })
      .otherwise({
        redirectTo: '/prompts'
      });
  }

  PromptApi.$inject = ['$http', 'API_BASE'];
  function PromptApi($http, API_BASE) {
    this.getAll = function () {
      return $http.get(API_BASE + '/');
    };

    this.create = function (payload) {
      return $http.post(API_BASE + '/', payload);
    };

    this.getById = function (id) {
      return $http.get(API_BASE + '/' + id + '/');
    };
  }

  PromptController.$inject = ['PromptApi', '$location', '$scope'];
  function PromptController(PromptApi, $location, $scope) {
    var vm = this;

    vm.prompts = [];
    vm.selectedPrompt = null;
    vm.detailId = null;
    vm.error = '';
    vm.success = '';
    vm.form = {
      title: '',
      content: '',
      complexity: 1
    };
    vm.loading = {
      list: false,
      create: false,
      detail: false
    };

    vm.loadPrompts = loadPrompts;
    vm.createPrompt = createPrompt;
    vm.loadPromptDetail = loadPromptDetail;
    vm.searchPromptById = searchPromptById;
    vm.isActive = isActive;

    init();

    function init() {
      $scope.$on('$routeChangeSuccess', function () {
        clearMessages();

        if (isActive('/prompts')) {
          loadPrompts();
        }
      });
    }

    function clearMessages() {
      vm.error = '';
      vm.success = '';
    }

    function parseError(err, fallback) {
      if (err && err.data && err.data.error) {
        return err.data.error;
      }
      return fallback;
    }

    function loadPrompts() {
      clearMessages();
      vm.loading.list = true;

      PromptApi.getAll()
        .then(function (res) {
          vm.prompts = res.data || [];
        })
        .catch(function () {
          vm.error = 'Could not load prompts. Confirm backend is running.';
        })
        .finally(function () {
          vm.loading.list = false;
        });
    }

    function createPrompt() {
      clearMessages();
      vm.loading.create = true;

      var payload = {
        title: vm.form.title,
        content: vm.form.content,
        complexity: Number(vm.form.complexity)
      };

      PromptApi.create(payload)
        .then(function (res) {
          vm.success = 'Prompt created with id ' + res.data.id;
          vm.form = {
            title: '',
            content: '',
            complexity: 1
          };
          $location.path('/prompts');
        })
        .catch(function (err) {
          vm.error = parseError(err, 'Could not create prompt.');
        })
        .finally(function () {
          vm.loading.create = false;
        });
    }

    function loadPromptDetail(id) {
      clearMessages();
      vm.loading.detail = true;

      PromptApi.getById(id)
        .then(function (res) {
          vm.selectedPrompt = res.data;
        })
        .catch(function (err) {
          vm.selectedPrompt = null;
          if (err && err.status === 404) {
            vm.error = 'Prompt with id ' + id + ' was not found. Create a prompt first.';
            return;
          }
          vm.error = parseError(err, 'Could not load prompt details.');
        })
        .finally(function () {
          vm.loading.detail = false;
        });
    }

    function searchPromptById() {
      if (!vm.detailId || vm.detailId < 1) {
        vm.error = 'Please enter a valid prompt id.';
        return;
      }

      loadPromptDetail(vm.detailId);
    }

    function isActive(path) {
      return $location.path() === path;
    }
  }
})();
