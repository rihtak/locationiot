function getKeyAndValue(cell){
    var result = {};
    result.key = Base64.decode(cell.column);
    result.value = Base64.decode(cell.$);
    return result;
}
function parseHBaseRest(data,primaryKey){
    var resultArray = []
   
    if(data.Row)
    {
         var row = {};
        for(var i=0;i<data.Row.length;i++){
            row[primaryKey] = Base64.decode(data.Row[i].key);
            //Parsing Column Family
            var columns = data.Row[i].Cell;
            for(var j=0;j<columns.length;j++){
                var cellData = getKeyAndValue(columns[j]);
                row[cellData.key] = cellData.value;
            }
            resultArray.push(row);
        }
        
        
        
    }
    return resultArray;
}