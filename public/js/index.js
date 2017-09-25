(function() {
	$(document).ready(function() {
		$(".modal").on("hidden.bs.modal", function() {
			$(this).find("input, output").val('').end();
		});

		var table = $('#objects').DataTable({
			responsive : true,
			retrieve : true,
			processing : true,
			serverSide : true,
			ajax : "/object",
			columns : [{
				data : "id"
			}, {
				data : "name"
			}, {
				data : "body__c"
			}, {
				data : "external_guid__c"
			}, {
				data : "createddate"
			}],
			columnDefs : [{
				targets : 5,
				render : function(data, type, full) {
					return '<button type="button" class="btn btn-info" data-toggle="modal" data-target="#editObject" id="editObjectActionButton"><i class="fa fa-pencil" aria-hidden="true" style="color:white;"></i></button>'
					+ ' <button type="button" class="btn btn-danger" data-toggle="modal" data-target="#deleteObject" id="deleteObjectActionButton"><i class="fa fa-lg fa-trash-o" aria-hidden="true" style="color:white;"></i></button>';
				}
			}, {
				responsivePriority : 1,
				targets : 5
			}, {
				render: function (data, type, full, meta) {
					return "<div class='text-wrap width-280'>" + data + "</div>";
				},
				targets: 2
			}]
		});
		
		$("#truncateObjects").click(function(event) {
			$.ajax({
				type: 'DELETE',
				url: '/object/all',
				dataType: 'json',
				success: function (data) {
					//Update table
					showNotification("success", 'All objects deleted successfully!');
					table.clear().draw();
				}, error: function () {
					showNotification("danger", 'We are sorry but our servers are having an issue right now');
				}
			});
		});
		
		$("#bulkInsertObjects").click(function(event) {
			$.ajax({
				type: 'POST',
				url: '/object/bulk/1000',
				dataType: 'json',
				success: function (data) {
					//Update table
					showNotification("success", 'All objects inserted successfully!');
					table.ajax.reload();
				}, error: function () {
					showNotification("danger", 'We are sorry but our servers are having an issue right now');
				}
			});
		});
		
		$("#createObject").click(function(event) {
			var form = document.getElementById("newObjectForm");
			form.reset();
		});
		
		$("#addButton").click(function(event) {
			if($('#newObjectForm').validator('validate').has('.has-error').length === 0){
				var data = {};
				data.name = $('#addNameObject').val();
				data.body__c = $('#addBodyObject').val();
				$.ajax({
					type: 'POST',
					url: '/object',
					data: data,
					dataType: 'json',
					success: function (data) {
						$('#newObject').modal('hide');
						// Update table
						showNotification("success", 'Object created successfully!');
						table.row.add( {
						 	"id": data.id,
							"name":   data.name,
							"body__c": data.body__c,
							"external_guid__c": data.external_guid__c,
							"createddate": data.createddate,
						}).draw();
					}, error: function () {
						showNotification("danger", 'We are sorry but our servers are having an issue right now');
					}
				});
			}
		});
		
		$("#objects tbody").on('click', '#editObjectActionButton', function() {
			var rowIndex = $(this).closest('tr').index();

			$(".modal-body #rowIndex").val(rowIndex);
			
			var id = table.rows(rowIndex).data()[0].id;
			$("#updateObjectForm #editIdObject").val(id);
			
			var name = table.rows(rowIndex).data()[0].name;
			$("#updateObjectForm #editNameObject").val(name);
			
			var body__c = table.rows(rowIndex).data()[0].body__c;
			$("#updateObjectForm #editBodyObject").val(body__c);
			
			var external_guid__c = table.rows(rowIndex).data()[0].external_guid__c;
			$("#updateObjectForm #editExternalGuidObject").val(external_guid__c);
			
			var createddate = table.rows(rowIndex).data()[0].createddate;
			$("#updateObjectForm #editCreatedDateObject").val(createddate);

			store.set('objectData', {
				id : id,
				name : name,
				body__c : body__c,
				external_guid__c : external_guid__c,
				createddate : createddate
			});
		});

		$("#editObject").on('click', '#editButton', function() {
			if($('#updateObjectForm').validator('validate').has('.has-error').length === 0){
				var update = true;
				var data = {}; //Keep order as it is 

				data.id = $('#updateObjectForm #editIdObject').val();
				data.name = $('#updateObjectForm #editNameObject').val();
				data.body__c = $('#updateObjectForm #editBodyObject').val();
				data.external_guid__c = $('#updateObjectForm #editExternalGuidObject').val();
				data.createddate = $('#updateObjectForm #editCreatedDateObject').val();

				if (JSON.stringify(store.get('objectData')).localeCompare(JSON.stringify(data)) == 0) {
					update = false;
				}

				if (update) {
					$.ajax({
						type : 'PUT',
						url : '/object/' + data.id,
						data : data,
						dataType : 'json',
						success : function(data) {
							$('#editObject').modal('hide');

							// Update table
							table.row.add({
								"id" : data.id,
								"name" : data.name,
								"body__c" : data.body__c,
								"external_guid__c": data.external_guid__c,
								"createddate" : data.createddate
							}).draw();

							showNotification("success", 'Object edited successfully!');
						},
						error : function() {
							showNotification("danger", 'We are sorry but our servers are having an issue right now');
						}
					});
				}
			}
		});
		
		$("#objects tbody").on("click", "#deleteObjectActionButton", function () {
			var rowIndex = $(this).closest('tr').index();
			$("#deleteObject #rowIndex").val(rowIndex);
		});
		
		$("#deleteObject").on('click', '#deleteButton', function () {
			var index = $("#deleteObject #rowIndex").val();
			var id = table.rows(index).data()[0].id;
			var data = {};
			data.id = id;
			$.ajax({
				type: 'DELETE',
				url: '/object/' + id,
				data: data,
				dataType: 'json',
				success: function (data) {
					//Update table
					showNotification("success", 'Object deleted successfully!');
					table.row($(this).parents('tr')).remove().draw();
				}, error: function () {
					showNotification("danger", 'We are sorry but our servers are having an issue right now');
				}
			});
		});
	});
}());