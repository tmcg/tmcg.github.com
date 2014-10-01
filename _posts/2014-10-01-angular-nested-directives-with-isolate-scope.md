--- 
layout: post
title: "AngularJS Nested Directives with Isolate Scope"
date: 2014-10-01T23:00+10:00
---

### Learning Angular

<img src="/assets/img/angularjs.png" alt="AngularJS">

I've been playing around a bit with AngularJS lately, of which the learning curve has been accurately described as <a href="http://www.bennadel.com/blog/2439-my-experience-with-angularjs-the-super-heroic-javascript-mvw-framework.htm">an emotional roller coaster</a>.

I came across an issue with nested directives that <a href="http://stackoverflow.com/questions/22296084/directives-isolated-scope-variables-are-undefined-if-it-is-wrapped-in-a-directi">others have faced as well</a>. 
This particular Stack Overflow question is still open but around six months old so I'm guessing it's probably been abandoned at this point.

-----

### The Goal

I have two directives nested inside one another, and I want to hide or remove the outer div/directive based on a property on the directive scope.
The button simply toggles the 'isEnabled' property on the controller scope. Something like this:


HTML
{% highlight html %}
<div ng-app="DemoApp" ng-controller="DemoCtrl">
    <button ng-click="vm.isEnabled = !vm.isEnabled">Toggle</button>
    <br/>

    Hi, {{ "{{vm.name1"}}}}!
    <div outer-directive data-model="vm">
        <span inner-directive data-model="vm"></span>
    </div>
</div>
{% endhighlight %}

Javascript
{% highlight javascript %}

var app = angular.module('DemoApp',[]);

app.controller('DemoCtrl',['$scope', function($scope) {
    $scope.vm = {
        name1: 'Bert',
        name2: 'Ernie',
        isEnabled: true
    };
}]);

app.directive('outerDirective', function() {
    return {
        restrict: 'A',
        scope: {
            vm_o: '=model'
        },
        transclude: true,
        template: "<div ng-if='vm_o.isEnabled'><span ng-transclude></span></div>"
    };
});

app.directive('innerDirective', function() {
    return {
        restrict: 'A',
        scope: {
            vm_i: '=model'
        },
        transclude: true,
        template: "Hi, {{"{{vm_i.name2"}}}}!"
    }
});

{% endhighlight %}

For the purposes of demonstration, I'm passing my view model data into the directive as-is from the controller scope.
I might otherwise want to pass only a subset of the view model data that relates only to the directives.

-----

### The Problem

If I run this ([fiddle](http://jsfiddle.net/yq62duzz/)) it clearly doesn't work properly. 
The toggle button works as expected, but the output is:

    [Toggle]
    Hi, Bert!
    Hi, !

-----

### The Solution(s)
 
The behaviour seems to relate to what's happening behind the scenes regarding the difference between <a href="https://docs.angularjs.org/api/ng/directive/ngIf">ng-if</a> and <a href="https://docs.angularjs.org/api/ng/directive/ngShow">ng-show</a>.

#### ng-if vs ng-show

The ng-if directive is removing and recreating a portion of the DOM depending on the expression provided. 
This behaviour is similar to jQuery's $('.elem').remove() and .append() functions.
In my case it appears that when the DOM fragment is recreated the transcluded inner directive expression is evaluated in the outer directive scope.

Contrast this behaviour with the ng-show directive, which uses CSS to show or hide a portion of the DOM depending on the expression provided. 
The ng-show behaviour more closely resembles jQuery's $('.elem').show() and .hide() functions.
Visible or hidden elements remain within the DOM, so the inner directive expression appears to be evaluated within the controller scope.

There are a few different ways to get the correct behaviour I'm looking for.

#### 1. Move the ng-if to the view markup
([Code](http://jsfiddle.net/aenpL8fv/))

The ng-if directive can be moved outside of the outer directive template to the view.
This works for a simple scenario, but the directive may have more complex removal logic internally than just a flag.

HTML
{% highlight html %}
<div ng-if="vm.isEnabled" outer-directive data-model="vm">
    <span inner-directive data-model="vm"></span>
</div>
{% endhighlight %}

Javascript
{% highlight javascript %}
app.directive('outerDirective', function() {
    return {
        restrict: 'A',
        scope: {
            vm_o: '=model'
        },
        transclude: true,
        template: "<div><span ng-transclude></span></div>"
    };
});
{% endhighlight %}


#### 2. Pass the inner directive model differently
([Code](http://jsfiddle.net/fbqxnu5x/))

The inner directive model can be referenced in the view markup as if it was a part of the outer directive template.
I don't like this way because it breaks the encapsulation of the outer directive code.

{% highlight html %}
<span inner-directive data-model="vm_o"></span>
{% endhighlight %}


#### 3. Don't transclude in the outer directive
([Code](http://jsfiddle.net/2d5mn7ep/))

It's possible to move the inner directive span element from the view markup to inside the directive template to have truly nested directives.
This solves the encapsulation issue, however it may not be an option if the intention is to customise some part of the outer directive content from the view.

HTML
{% highlight html %}
<div outer-directive data-model="vm"></div>
{% endhighlight %}

Javascript
{% highlight javascript %}
app.directive('outerDirective', function() {
    return {
        restrict: 'A',
        scope: {
            vm_o: '=model'
        },
        template: "<div ng-if='vm_o.isEnabled'><span inner-directive data-model='vm_o'></span></div>"
    };
});
{% endhighlight %}


#### 4. Use ng-show instead of ng-if
([Code](http://jsfiddle.net/k32s118z/))

The inner directive model can be passed directly from the controller when using ng-show.

{% highlight html %}
<div ng-show='vm_o.isEnabled'>Hello <span ng-transclude></span></div>
{% endhighlight %}

-----

Perhaps there's a better option? Let me know!

