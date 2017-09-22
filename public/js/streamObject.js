(function() {
	$(document).ready(function() {
		$(".modal").on("hidden.bs.modal", function() {
			$(this).find("input, output").val('').end();
		});

		var table = $('#streamObjects').DataTable({
			responsive : true,
			retrieve : true,
			processing : true,
			serverSide : true,
			ajax : "/streamObject",
			columns : [{
				data : "id"
			}, {
				data : "systemmodstamp"
			}, {
				data : "name"
			}, {
				data : "createddate"
			}, {
				data : "body__c"
			}, {
				data : "external_guid__c"
			}],
			columnDefs : [{
				targets : 6,
				render : function(data, type, full) {
					return '<button type="button" class="btn btn-info" data-toggle="modal" data-target="#editStreamObject" id="editStreamObjectButton"><i class="fa fa-pencil" aria-hidden="true" style="color:white;"></i></button>'
					+ ' <button type="button" class="btn btn-danger" data-toggle="modal" data-target="#deleteSO" id="deleteStreamObject"><i class="fa fa-lg fa-trash-o" aria-hidden="true" style="color:white;"></i></button>';
				}
			}, {
				responsivePriority : 1,
				targets : 6
			}]
		});
		
		$("#createStreamObject").click(function(event) {
			var form = document.getElementById("newStreamObjectForm");
			form.reset();
		});
		
		$("#submit").click(function(event) {
			if($('#newStreamObjectForm').validator('validate').has('.has-error').length === 0){
				var data = {};
				data.name = $('#name').val();
				data.body__c = $('#body__c').val();
				$.ajax({
					type: 'POST',
					url: '/streamObject',
					data: data,
					dataType: 'json',
					success: function (data) {
						$('#newStreamObject').modal('hide');
						// Update table
						showNotification("success", 'Stream object created successfully!');
						table.row.add( {
						 	"id": data.id,
							"systemmodstamp": data.systemmodstamp,
							"name":   data.name,
							"createddate":     data.createddate,
							"isdeleted":  data.isdeleted,
							"body__c": data.body__c,
							"external_guid__c": data.external_guid__c
						}).draw();
					}, error: function () {
						showNotification("danger", 'We are sorry but our servers are having an issue right now');
					}
				});
			}
		});
		
		$("#streamObjects tbody").on('click', '#editStreamObjectButton', function() {
			var rowIndex = $(this).closest('tr').index();

			$(".modal-body #rowIndex").val(rowIndex);
			
			var id = table.rows(rowIndex).data()[0].id;
			$(".modal-body #idStreamObject").val(id);
			
			var systemmodstamp = table.rows(rowIndex).data()[0].systemmodstamp;
			$(".modal-body #streamObjectSystemModStamp").val(systemmodstamp);
			
			var name = table.rows(rowIndex).data()[0].name;
			$(".modal-body #streamObjectName").val(name);
			
			var createddate = table.rows(rowIndex).data()[0].createddate;
			$(".modal-body #streamObjectCreatedDate").val(createddate);
			
			var isdeleted = table.rows(rowIndex).data()[0].isdeleted;
			$(".modal-body #streamObjectIsDeleted").val(isdeleted);
			
			var body__c = table.rows(rowIndex).data()[0].body__c;
			$(".modal-body #streamObjectBody").val(body__c);
			
			var external_guid__c = table.rows(rowIndex).data()[0].external_guid__c;
			$(".modal-body #streamObjectExternalGuid").val(external_guid__c);

			store.set('streamObjectData', {
				id : id,
				systemmodstamp : systemmodstamp,
				name : name,
				createddate : createddate,
				isdeleted : isdeleted,
				body__c : body__c,
				external_guid__c : external_guid__c
			});
		});

		$("#editStreamObject").on('click', '#edit', function() {
			if($('#updateStreamObjectForm').validator('validate').has('.has-error').length === 0){
				var update = true;
				var data = {}; //Keep order as it is 

				data.id = $('#editStreamObject #idStreamObject').val();
				data.systemmodstamp = $('#editStreamObject #streamObjectSystemModStamp').val();
				data.name = $('#editStreamObject #streamObjectName').val();
				data.createddate = $('#editStreamObject #streamObjectCreatedDate').val();
				data.isdeleted = $('#editStreamObject #streamObjectIsDeleted').val();
				data.body__c = $('#editStreamObject #streamObjectBody').val();
				data.external_guid__c = $('#editStreamObject #streamObjectExternalGuid').val();

				if (JSON.stringify(store.get('streamObjectData')).localeCompare(JSON.stringify(data)) == 0) {
					update = false;
				}

				if (update) {
					$.ajax({
						type : 'PUT',
						url : '/streamObject/' + data.ID,
						data : data,
						dataType : 'json',
						success : function(data) {
							$('#editStreamObject').modal('hide');

							// Update table
							table.row.add({
								"id" : data.id,
								"systemmodstamp" : data.systemmodstamp,
								"name" : data.name,
								"createddate" : data.createddate,
								"isdeleted" : data.isdeleted,
								"body__c" : data.body__c,
								"external_guid__c": data.external_guid__c
							}).draw();

							showNotification("success", 'StreamObject edited successfully!');
						},
						error : function() {
							showNotification("danger", 'We are sorry but our servers are having an issue right now');
						}
					});
				}
			}
		});
		
		$("#streamObjects tbody").on("click", "#deleteStreamObject", function () {
	    	var rowIndex = $(this).closest('tr').index();
	    	$(".modal-body #rowIndex").val(rowIndex);
		});
		
		$("#deleteSO").on('click', '#delete', function () {
			var index = document.getElementById('rowIndex').value;
			var id = table.rows(index).data()[0].id;
			var data = {};
			data.id = id;
	    	$.ajax({
		    	type: 'DELETE',
		    	url: '/streamObject/'+id,
		    	data: data,
		    	dataType: 'json',
		     	success: function (data) {
		     		//Update table
					showNotification("success", 'Stream Object deleted successfully!');
		        	table.row($(this).parents('tr')).remove().draw();
			    }, error: function () {
					showNotification("danger", 'We are sorry but our servers are having an issue right now');
			   	}
			});
		});
	});
}());