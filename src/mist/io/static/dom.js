var NODE_NAME_CHARACTERS = 35;
var STATES = {
    '0' : 'Running',
    '1' : 'Rebooting',
    '2' : 'Terminated',
    '3' : 'Pending',
    '4' : 'Unknown',            
    };
    
$(document).bind("mobileinit", function(){
    var buttonsAmount = backends.length;

    backends.forEach(function(b, i){
        // TODO: create provider widget
        b.newAction(['list_machines']);
    });

    //after getting the machines, get images and sizes
    backends.forEach(function(b, i){
        b.newAction(['list_sizes']);
        b.newAction(['list_images']);
        b.newAction(['list_locations']);
    });
});


function update_machines_view(backend){
    return;
    // TODO    
    $('#logo-container').animate({opacity : 0.05});
    backend.machines.forEach(function(machine, index){
        var node = $('#machines-list > #' + backends.indexOf(backend) + '-' + machine.id);
        /*// Calculate ip_txt
        var primary_ip = machine.public_ips[0] || machine.private_ips[0] || "";
        var all_ips = machine.public_ips.concat(machine.private_ips);
        if (all_ips.length > 1) {
            all_ips = ' <span class="more">...</span><span class="all-ips">' + all_ips.join(' - ') + "</span>";
        } else {
            all_ips = '<span class="more"></span><span class="all-ips">' + primary_ip + "</span>";
        }
        var ip_txt = '<span class="primary">'+primary_ip+"</span>"+all_ips;*/
        
        if (node.length == 1) { // there should be only one machine with this id in the DOM
            if (node.find('.name').text() != machine.name
                // || node.find('.ip').html() != ip_txt
                ){
                node.fadeOut(100);                
                node.find('.name').text(truncate_names(machine.name, NODE_NAME_CHARACTERS));
                node.find('.backend').text(backends.indexOf(backend));
                node.find('.backend').addClass('provider'+backend.provider);
                //node.find('.ip').html(ip_txt);
                node.find('.select')[0].id = 'chk-' + machine.id;
                node.fadeIn(100);
            }
            node.find('.state').removeClass().addClass('state').addClass('state'+machine.state);
        } else { // if the machine does does exist in the DOM, then add it 
            if (node.length != 0){
                log.newMessage(ERROR, 'DOM Error: ' + node);
            }
            node = $('.node-template').clone();
            node.removeClass('node-template');
            node.addClass('node');
            node.find('.name').text(truncate_names(machine.name, NODE_NAME_CHARACTERS));
            node.find('.backend').text(backends.indexOf(backend));
            node.find('.backend').addClass('provider'+backend.provider);
            //node.find('.ip').html(ip_txt);
            node.find('.state').addClass('state'+machine.state);
            node.find('.state').attr('title', STATES[machine.state]);
            node.find('.select')[0].id = 'chk-' + machine.id;
            node.find('label').attr('for', 'chk-' + machine.id);
            node[0].id = backends.indexOf(backend) + '-' + machine.id;
            node.appendTo('#machines-list');
            node.fadeIn(200);
        }
    });

    //Make a list of all machine ids first, from all backends and check if machine
    //is in DOM but not in list, then delete it from DOM. Example id: 2-18
    var machines_list = [];
    for (var i = 0 ; i < backends.length; i++) {
        for (var m in backends[i].machines) {
            machines_list.push(i + '-' + backends[i].machines[m].id);
        }
    }

    $('#machines-list').find('.node').each(function (i) { 
        if ($.inArray(this.id, machines_list) == -1) {
            $('#' + this.id).remove();
        }
    });      
    update_machines_count();
}

// update the machines counter
function update_machines_count() {
    return;
    // TODO    
    var allMachines = 0;
    for (var i = 0 ; i < backends.length; i++) {
        allMachines += backends[i].machines.length;
    }

    $('#all-machines').text(allMachines);
}

//updates the messages notifier
function update_message_notifier() {
    return;
    // TODO
    if (log.messages[log.messages.length-1][0] < LOGLEVEL){
        clearTimeout(log.timeout);
        if (!$('#notifier').is (':visible')){
            $('#notifier').slideDown(300);
        }
        var txt = log.messages[log.messages.length-1][1].toISOString() + " : " + log.messages[log.messages.length-1].slice(2).join(' - ');
        $('#notifier span.text').text(txt);
        update_messages_count();
        log.timeout = setTimeout("$('#notifier, #notifier-in').slideUp(300)", 5000);
    }
}

// Message notifier mouseenter and mouseleave events
$('#notifier, #notifier-in').mouseenter(function() {
    clearTimeout(log.timeout);
}).mouseleave(function() {
    // TODO: fix selectors
    log.timeout = setTimeout("$('#notifier, #notifier-in').slideUp(300)", 5000);
});

// update the messages counter
function update_messages_count() {
    return;
    // TODO: fix selectors
    var message_count = log.messages.filter(function(el,i){return el[0] < LOGLEVEL}).length;
    if (message_count == 1) {
        messages = ' message';
    } else {
        messages =  ' messages';
    }
    $('#notifier span.messages-count').text(message_count + messages);
}