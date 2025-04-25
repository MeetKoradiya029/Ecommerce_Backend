import { tempJson } from "../utils/constants"
import * as XLSX from 'xlsx';
import path from 'path';
import axios from 'axios';
import { setTimeout } from 'timers/promises';
import fs from 'fs/promises';


const jsonProcess = async (req: any, res: any) => {
    const resultsArray: Array<any> = tempJson.results;
    let flatArray: any[] = [];
    let mappedData: any[] = [];
    const delayBetweenRequests = 1000; // 1 seconds
    let offset = 0;

    for (let index = 0; index < 33; index++) {

        try {

           
            let response;
            console.log(`offset`, offset);
            
            response = await axios.get(`https://data.cityofnewyork.us/api/catalog/v1?explicitly_hidden=false&limit=100&offset=${offset}&order=relevance&published=true&search_context=data.cityofnewyork.us&show_unsupported_data_federated_assets=false&tags=&approval_status=approved&audience=public`)

            const resultArray = response.data.results;
            

            resultArray.forEach((item: any) => {
                const resourceObj = item['resource'];
                const classificationObj = item['classification'];
                const permalink = item['permalink'];
                const link = item['link']
                const name = resourceObj?.name;

                const newObj = getObj(resourceObj);

                if (classificationObj) {
                    newObj['domain_category'] = classificationObj['domain_category'];
                    if (Array.isArray(classificationObj['domain_tags'])) {
                        newObj['domain_tags'] = classificationObj['domain_tags'].join(",");
                    }
                }

                if (permalink) {
                    newObj['permalink'] = permalink
                }

                if (link) {
                    newObj['link'] = link
                }

                const columnsName = resourceObj.columns_name || [];
                const columnsDatatype = resourceObj.columns_datatype || [];
                const columnsFieldName = resourceObj.columns_field_name || [];
                const columnsDescription = resourceObj.columns_description || [];

                // Find the maximum possible iterations based on the longest array
                const maxLength = Math.max(
                    columnsName.length,
                    columnsDatatype.length,
                    columnsFieldName.length,
                    columnsDescription.length
                );

                for (let index = 0; index < maxLength; index++) {
                    // Get all values for current index
                    const colName = columnsName[index];
                    const colDatatype = columnsDatatype[index];
                    const colFieldName = columnsFieldName[index];
                    const colDescription = columnsDescription[index];

                    // Only include if all values exist
                    if (colName && colDatatype && colFieldName && colDescription) {
                        mappedData.push({
                            name: name,
                            columns_name: colName,
                            columns_datatype: colDatatype,
                            columns_field_name: colFieldName,
                            columns_description: colDescription
                        });
                    }
                }

                flatArray.push(newObj);

                
            });

            console.log("index >>>>>", index);
            
            offset += 100;
            console.log("offset after update >>>>>", offset);
            console.log("flatArray ????", flatArray.length);
            

            if (index < 321) {
                await setTimeout(delayBetweenRequests);
            }
        } catch (error) {
            console.error(`Error fetching data for offset ${index}:`, error);
        }
    }


    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert array of objects to worksheet
    const worksheet = XLSX.utils.json_to_sheet(flatArray);
    const worksheet2 = XLSX.utils.json_to_sheet(mappedData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "FlatData");
    XLSX.utils.book_append_sheet(workbook, worksheet2, "mappedData");

    // Define file path in project root
    const filePath = path.join(process.cwd(), 'export.xlsx');

    try {
        // Write file to disk
        XLSX.writeFile(workbook, filePath);

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Excel file created successfully',
            path: filePath
            // data: flatArray
        });
    } catch (error: any) {
        console.error('Error writing Excel file:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create Excel file',
            error: error.message
        });
    }


};

function getObj(resourceObj: any) {
    let newObj: any = {};

    for (const key in resourceObj) {
        const value = resourceObj[key];

        // Handle primitive values
        if (value !== null && typeof value !== 'object' && !Array.isArray(value)) {
            newObj[key] = value;
        }

    }

    return newObj;
}
export default {
    jsonProcess
}