define('app/controllers/rules', [
    'app/models/rule',
    'ember',
    'jquery'
    ],
    /**
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

            updateRule: function(id, metric, operator, value, actionToTake, command) {
                
                var rule = this.getRuleById(id);
                
                if (!rule) {
                    return false;
                }
                
                // Make sure parameters are not null
                if (!value) { value = rule.value; }
                if (!metric) { metric = rule.metric; }
                if (!command) { command = rule.command; }
                if (!operator) { operator = rule.operator; }
                if (!actionToTake) { actionToTake = rule.actionToTake; }
                
                // Check if anything changed
                if (value == rule.value &&
                    metric == rule.metric &&
                    command == rule.command &&
                    actionToTake == rule.actionToTake &&
                    operator.title == rule.operator.title ) {
                        return false;
                }
                
                // Fix value on metric change
                if ((metric != 'network-tx') || (metric != 'disk-write')) {
                    if (value > 100) {
                        value = 100;
                    }
                }
                
                var payload = {
                    'id': id,
                    'value': value,
                    'metric': metric,
                    'command': command,
                    'operator': operator.title,
                    'action': actionToTake,
                };
                
                rule.set('pendingAction', true);
                $.ajax({
                    url: 'rules',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(payload),
                    success: function(data) {
                        info('Successfully updated rule ', id);
                        rule.set('pendingAction', false);
                        rule.set('value', value);
                        rule.set('metric', metric);
                        rule.set('command', command);
                        rule.set('operator', operator);
                        rule.set('actionToTake', actionToTake);
                        rule.set('maxValue', data.max_value);
                        
                        var maxvalue = parseInt(rule.maxValue);
                        var curvalue = parseInt(rule.value);
                        if (curvalue > maxvalue) {
                            rule.set('value', maxvalue);
                        }
                    },
                    error: function(jqXHR, textstate, errorThrown) {
                        Mist.notificationController.notify('Error while updating rule');
                        error(textstate, errorThrown, 'while updating rule');
                        rule.set('pendingAction', false);
                    }
                });
            },

            saveCommand: function() {
                $('.rule-command-popup').popup('close');
                // Check if command did not actually change
                var oldCommand = this.commandRule.get('command');
                if (this.command == oldCommand) {
                    if (this.commandRule.get('actionToTake') == 'command') {
                        return;
                    }
                }
                this.updateRule(this.commandRule.id, null, null, null, 'command', this.command);
            },

            changeRuleValue: function(event) {
                var rule_id = $(event.currentTarget).attr('id');
                var rule_value = $(event.currentTarget).find('.ui-slider-handle').attr('aria-valuenow');
                this.updateRule(rule_id, null, null, rule_value);
            },

            handleRuleSliders: function() {
                function sliderShowHandler(event) {
                    $(event.currentTarget).addClass('open');
                    $(event.currentTarget).find('.ui-slider-track').fadeIn(50);
                }
                function sliderHideHandler(event) {
                    $(event.currentTarget).find('.ui-slider-track').fadeOut(50);
                    $(event.currentTarget).find('.ui-slider').removeClass('open');
                    Mist.rulesController.changeRuleValue(event);
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
                $('#single-machine').off('tap');
                $('.rule-box').off('mouseleave');
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
