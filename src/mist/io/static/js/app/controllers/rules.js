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

            getRuleById: function(ruleId){
                for (var i = 0; i < this.content.length; i++){
                    if (this.content[i].id == ruleId) {
                        return this.content[i];
                    }
                }
            },
            
            getOperatorByTitle: function(title){
                var ret = null;
                this.operatorList.forEach(function(op){
                    if (op.title == title){
                        ret = op;
                    }
                });
                return ret;
            },

            newRule: function(machine, metric, operator, value, actionToTake) {
                var rule = Rule.create({
                    'machine': machine,
                    'metric': metric,
                    'operator': operator,
                    'value': value,
                    'actionToTake': actionToTake
                });
                var that = this;
                rule.set('id', 'new');
                that.pushObject(rule);
                that.redrawRules();
                Ember.run.later(function() {
                    $('#new .delete-rule-container').hide();
                    $('#new .ajax-loader').show();
                }, 100);

                var payload = {
                    'backendId': machine.backend.id,
                    'machineId': machine.id,
                    'metric': metric,
                    'operator': operator.title,
                    'value': value,
                    'action': actionToTake
                };
                $('#add-rule-button').button('disable');
                $('#add-rule-button').button('refresh');
                $.ajax({
                    url: 'rules',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(payload),
                    success: function(data) {
                        info('Successfully created rule ', data['id']);
                        rule.set('id', data['id']);
                        $('#new').attr('id', data['id']);
                        $('.rule-box').last().find('.delete-rule-container').show();
                        $('.rule-box').last().find('.ajax-loader').hide();
                        $('#add-rule-button').button('enable');
                        $('#add-rule-button').button('refresh');
                        rule.set('maxValue', data['max_value']);
                    },
                    error: function(jqXHR, textstate, errorThrown) {
                        Mist.notificationController.notify('Error while creating rule');
                        error(textstate, errorThrown, 'while creating rule');
                        that.removeObject(rule);
                        that.redrawRules();
                        $('#add-rule-button').button('enable');
                        $('#add-rule-button').button('refresh');
                    }
                });

                return rule.id;

            },

            saveCommand: function() {
                var oldAction = this.commandRule.get('actionToTake');
                var oldCommand = this.commandRule.get('command');

                $('.rule-command-popup').popup('close');

                if (this.command == oldCommand) {
                    return false;
                }
                
                warn('setting command for '+ this.commandRule.id + ' to ' + this.command);
                
                this.commandRule.set('actionToTake', 'command');
                this.commandRule.set('command', this.command);

                var payload = {
                    'id' : this.commandRule.id,
                    'action' : 'command',
                    'command': this.command
                };
                var that = this;
                $.ajax({
                    url: 'rules',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(payload),
                    success: function(data) {
                        info('Successfully updated rule', that.commandRule.id);
                    },
                    error: function(jqXHR, textstate, errorThrown) {
                        Mist.notificationController.notify('Error while updating rule');
                        error(textstate, errorThrown, 'while updating rule');
                        that.commandRule.set('actionToTake', oldAction);
                        that.commandRule.set('command', oldCommand);
                        that.command.set(oldCommand);
                    }
                });
            },

            renewRule: function(event) {
                var that = this;
                if (($(event.currentTarget).attr('id') != 'new') && ($(event.currentTarget).attr('id'))) {
                    var rule_id = $(event.currentTarget).attr('id');
                    var rule_value = $(event.currentTarget).find('.ui-slider-handle').attr('aria-valuenow');
                    var rule = that.getRuleById(rule_id);
                    if (rule.value != rule_value) {
                        var payload = {
                            'id' : rule.id,
                            'value' : rule_value
                        };
                        $('#' + rule.id + ' .delete-rule-container').hide();
                        $('#' + rule.id + ' .ajax-loader').show();
                        $.ajax({
                            url: 'rules',
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify(payload),
                            success: function(data) {
                                info('Successfully updated rule ', rule.id);
                                rule.set('value', rule_value);
                                $('#' + rule.id + ' .ajax-loader').hide();
                                $('#' + rule.id + ' .delete-rule-container').show();
                            },
                            error: function(jqXHR, textstate, errorThrown) {
                                Mist.notificationController.notify('Error while updating rule');
                                error(textstate, errorThrown, 'while updating rule');
                                $('#' + rule.id + ' .ajax-loader').hide();
                                $('#' + rule.id + ' .delete-rule-container').show();
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
