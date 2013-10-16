define('app/controllers/rules', [
    'app/models/rule',
    'ember',
    'jquery'
    ],
    /**
     *
     * Rules controller
     *
     * @returns Class
     */
    function(Rule) {
        return Ember.ArrayController.extend({
            command: null,
            commandRule: null,

            metricList: [
                'load',
                'cpu',
                'ram',
                'disk-write',
                'network-tx'
            ],

            operatorList: [
                {'title': 'gt', 'symbol': '>'},
                {'title': 'lt', 'symbol': '<'}
            ],

            actionList: [
                'alert',
                'reboot',
                'destroy',
                //'launch',
                'command'
            ],

            getRuleById: function(ruleId) {
                for (var i = 0; i < this.content.length; i++) {
                    if (this.content[i].id == ruleId) {
                        return this.content[i];
                    }
                }
                return null;
            },
            
            getOperatorByTitle: function(title) {
                var ret = null;
                this.operatorList.forEach(function(op) {
                    if (op.title == title){
                        ret = op;
                    }
                });
                return ret;
            },

            pendingActionObserver: function() {
                Ember.run.next(function() {
                    $('.delete-rule-container').trigger('create');
                });
            }.observes('this.content.@each.pendingAction'),

            newRule: function(machine, metric, operator, value, actionToTake) {
                var rule = Rule.create({
                    'id': 'new',
                    'machine': machine,
                    'metric': metric,
                    'operator': operator,
                    'value': value,
                    'actionToTake': actionToTake,
                    'pendingAction': true
                });
                
                this.pushObject(rule);
                this.redrawRules();
                
                var payload = {
                    'backendId': machine.backend.id,
                    'machineId': machine.id,
                    'metric': metric,
                    'operator': operator.title,
                    'value': value,
                    'action': actionToTake
                };
                $('#add-rule-button').button('disable');
                var that = this;
                $.ajax({
                    url: 'rules',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(payload),
                    success: function(data) {
                        info('Successfully created rule ', data.id);
                        rule.set('id', data.id);
                        rule.set('pendingAction', false);
                        rule.set('maxValue', data.max_value);
                        $('#new').attr('id', data.id);
                        $('#add-rule-button').button('enable');
                    },
                    error: function(jqXHR, textstate, errorThrown) {
                        Mist.notificationController.notify('Error while creating rule');
                        error(textstate, errorThrown, 'while creating rule');
                        that.removeObject(rule);
                        that.redrawRules();
                        $('#add-rule-button').button('enable');
                    }
                });
            },

            saveCommand: function() {
                $('.rule-command-popup').popup('close');
                
                var oldCommand = this.commandRule.get('command');
                if (this.command == oldCommand) {
                    if (this.commandRule.get('actionToTake') == 'command') {
                        return;
                    }
                }
                var payload = {
                    'id' : this.commandRule.id,
                    'action' : 'command',
                    'command': this.command
                };
                this.commandRule.set('pendingAction', true);
                var that = this;
                $.ajax({
                    url: 'rules',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(payload),
                    success: function(data) {
                        info('Successfully updated rule', that.commandRule.id);
                        that.commandRule.set('pendingAction', false);
                        that.commandRule.set('actionToTake', 'command');
                        that.commandRule.set('command', that.command);
                    },
                    error: function(jqXHR, textstate, errorThrown) {
                        Mist.notificationController.notify('Error while updating rule');
                        error(textstate, errorThrown, 'while updating rule');
                        that.commandRule.set('pendingAction', false);
                    }
                });
            },

            renewRule: function(event) {
                var that = this;
                var rule_id = $(event.currentTarget).attr('id');
                
                if ((rule_id != 'new') && rule_id) {
                
                    var rule = that.getRuleById(rule_id);
                    var rule_value = $(event.currentTarget).find('.ui-slider-handle').attr('aria-valuenow');
                    
                    if (rule.value != rule_value) {
                        var payload = {
                            'id' : rule.id,
                            'value' : rule_value
                        };
                        rule.set('pendingAction', true);
                        $.ajax({
                            url: 'rules',
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify(payload),
                            success: function(data) {
                                info('Successfully updated rule ', rule.id);
                                rule.set('pendingAction', false);
                                rule.set('value', rule_value);
                            },
                            error: function(jqXHR, textstate, errorThrown) {
                                Mist.notificationController.notify('Error while updating rule');
                                error(textstate, errorThrown, 'while updating rule');
                                rule.set('pendingAction', false);
                            }
                        });
                    }
                }
            },

            handleRuleSliders: function() {
                var that = this;
                function sliderShowHandler(event) {
                    $(event.currentTarget).addClass('open');
                    $(event.currentTarget).find('.ui-slider-track').fadeIn(200);
                }
                function sliderHideHandler(event) {
                    $(event.currentTarget).find('.ui-slider').removeClass('open');
                    $(event.currentTarget).find('.ui-slider-track').fadeOut(200);
                    that.renewRule(event);
                }
                $('.ui-slider').on('tap', sliderShowHandler);
                $('.ui-slider').on('click', sliderShowHandler);
                $('.ui-slider').on('mouseover', sliderShowHandler);
                $('#single-machine').on('tap', sliderHideHandler);
                $('.rule-box').on('mouseleave', sliderHideHandler);
            },

            unhandleRuleSliders: function() {
                $('.ui-slider').off('tap');
                $('.ui-slider').off('click');
                $('.ui-slider').off('mouseover');
            },

            redrawRules: function() {
                var that = this;
                Ember.run.next(function() {
                    that.unhandleRuleSliders();
                    $('.rule-box').trigger('create');
                    that.handleRuleSliders();
                });
            },
        });
    }
);
