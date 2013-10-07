define('app/views/user_menu', [
    'text!app/templates/user_menu.html',
    'ember'
    ],
    /**
     *
     * Logout Dialog
     *
     * @returns Class
     */
    function(user_menu_html) {
        return Ember.View.extend({
            tagName: false,
            gravatarURL: 'https://www.gravatar.com/avatar/'+md5(EMAIL)+'?d=https%3A%2F%2Fmist.io%2Fcore%2Fmavatar.png&size=16',
            email: EMAIL,
            account_url: URL_PREFIX + '/account',
            logout: URL_PREFIX.length == 0 ? true : false,
            template: Ember.Handlebars.compile(user_menu_html),
        
            click: function(){
        	   $("#user-dialog").popup("open");
            }
        });
    }
);
